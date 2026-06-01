const express        = require("express");
const router         = express.Router();
const db             = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/threads", authMiddleware, async (req, res) => {
  try {

    const result = await db.query(
      `SELECT
          t.id,
          t.name,
          t.is_group,
          t.updated_at,

          /* Last message preview */
          m.content      AS last_message,
          m.created_at   AS last_message_at,
          sender.username AS last_sender,

          /* Unread count */
          COUNT(unread.id) AS unread_count,

          /* For DMs: the other person's info */
          other_user.id            AS other_user_id,
          other_user.username      AS other_username,
          other_profile.display_name AS other_display_name,
          other_user.online_status AS other_status

        FROM message_threads t
        JOIN thread_members tm
          ON tm.thread_id = t.id
         AND tm.user_id   = $1

        /* Last message */
        LEFT JOIN LATERAL (
          SELECT id, content, created_at, sender_id
            FROM messages
           WHERE thread_id  = t.id
             AND deleted_at IS NULL
           ORDER BY created_at DESC
           LIMIT 1
        ) m ON TRUE

        LEFT JOIN users sender
          ON sender.id = m.sender_id

        /* Unread */
        LEFT JOIN messages unread
          ON unread.thread_id  = t.id
         AND unread.read_at    IS NULL
         AND unread.sender_id  != $1
         AND unread.deleted_at IS NULL
         AND (tm.last_read_at IS NULL OR unread.created_at > tm.last_read_at)

        /* Other user in DM */
        LEFT JOIN thread_members other_tm
          ON other_tm.thread_id = t.id
         AND other_tm.user_id  != $1
         AND t.is_group = FALSE
        LEFT JOIN users other_user
          ON other_user.id = other_tm.user_id
        LEFT JOIN user_profiles other_profile
          ON other_profile.user_id = other_user.id

       WHERE tm.user_id = $1

       GROUP BY
          t.id, t.name, t.is_group, t.updated_at,
          m.content, m.created_at, sender.username,
          other_user.id, other_user.username,
          other_profile.display_name, other_user.online_status

       ORDER BY t.updated_at DESC`,
      [req.userId]
    );

    return res.json({ threads: result.rows });

  } catch (err) {
    console.error("THREADS FETCH ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch threads." });
  }
});


/* =========================================================
   POST /api/messages/threads
   ---------------------------------------------------------
   Body (DM):    { recipient_id: number }
   Body (Group): { name: string, member_ids: number[] }
   Returns existing DM thread if one already exists.
   ========================================================= */

router.post("/threads", authMiddleware, async (req, res) => {
  const client = await db.connect();
  try {

    await client.query("BEGIN");

    const { recipient_id, name, member_ids } = req.body;
    const isGroup = !!name && Array.isArray(member_ids);

    if (!isGroup && !recipient_id) {
      return res.status(400).json({ message: "recipient_id required for DM." });
    }

    /* CHECK FOR EXISTING DM THREAD */
    if (!isGroup) {
      const existing = await client.query(
        `SELECT t.id
           FROM message_threads t
           JOIN thread_members a ON a.thread_id = t.id AND a.user_id = $1
           JOIN thread_members b ON b.thread_id = t.id AND b.user_id = $2
          WHERE t.is_group = FALSE
          LIMIT 1`,
        [req.userId, recipient_id]
      );

      if (existing.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.json({ thread_id: existing.rows[0].id, existing: true });
      }
    }

    /* CREATE THREAD */
    const thread = await client.query(
      `INSERT INTO message_threads (name, is_group, created_by)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [name || null, isGroup, req.userId]
    );

    const threadId = thread.rows[0].id;

    /* ADD MEMBERS */
    const allMembers = isGroup
      ? [...new Set([req.userId, ...member_ids])]
      : [req.userId, recipient_id];

    for (const userId of allMembers) {
      await client.query(
        `INSERT INTO thread_members (thread_id, user_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [threadId, userId]
      );
    }

    await client.query("COMMIT");
    return res.status(201).json({ thread_id: threadId, existing: false });

 } catch (err) {
  await client.query("ROLLBACK");

  console.error("CREATE THREAD ERROR:", err);

  return res.status(500).json({
    message: err.message,
    detail: err.detail,
    code: err.code,
    stack: err.stack
  });
}
  } finally {
    client.release();
  }
});


/* =========================================================
   GET /api/messages/threads/:id
   ========================================================= */

router.get("/threads/:id", authMiddleware, async (req, res) => {
  try {

    const threadId = parseInt(req.params.id, 10);
    const limit    = parseInt(req.query.limit,  10) || 50;
    const before   = req.query.before || null; // cursor: created_at timestamp

    /* Verify membership */
    const member = await db.query(
      `SELECT 1 FROM thread_members
        WHERE thread_id = $1 AND user_id = $2`,
      [threadId, req.userId]
    );

    if (member.rows.length === 0) {
      return res.status(403).json({ message: "Not a member of this thread." });
    }

    /* Thread metadata */
    const thread = await db.query(
      `SELECT t.id, t.name, t.is_group, t.created_at,
              json_agg(json_build_object(
                'user_id',      tm.user_id,
                'username',     u.username,
                'display_name', p.display_name,
                'online_status', u.online_status
              )) AS members
         FROM message_threads t
         JOIN thread_members tm ON tm.thread_id = t.id
         JOIN users u           ON u.id = tm.user_id
         LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE t.id = $1
        GROUP BY t.id`,
      [threadId]
    );

    /* Messages */
    const messages = await db.query(
      `SELECT
          m.id,
          m.content,
          m.created_at,
          m.read_at,
          m.sender_id,
          u.username     AS sender_username,
          p.display_name AS sender_display_name
        FROM messages m
        JOIN users u        ON u.id = m.sender_id
        LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE m.thread_id  = $1
         AND m.deleted_at IS NULL
         ${before ? "AND m.created_at < $3" : ""}
       ORDER BY m.created_at ASC
       LIMIT $2`,
      before ? [threadId, limit, before] : [threadId, limit]
    );

    return res.json({
      thread:   thread.rows[0],
      messages: messages.rows
    });

  } catch (err) {
    console.error("THREAD FETCH ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch thread." });
  }
});


/* =========================================================
   POST /api/messages/threads/:id
   ========================================================= */

router.post("/threads/:id", authMiddleware, async (req, res) => {
  try {

    const threadId = parseInt(req.params.id, 10);
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Message content required." });
    }

    /* Verify membership */
    const member = await db.query(
      `SELECT 1 FROM thread_members
        WHERE thread_id = $1 AND user_id = $2`,
      [threadId, req.userId]
    );

    if (member.rows.length === 0) {
      return res.status(403).json({ message: "Not a member of this thread." });
    }

    /* Insert message */
    const message = await db.query(
      `INSERT INTO messages (thread_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, created_at, sender_id`,
      [threadId, req.userId, content.trim()]
    );

    /* Bump thread updated_at */
    await db.query(
      `UPDATE message_threads SET updated_at = NOW() WHERE id = $1`,
      [threadId]
    );

    return res.status(201).json({ message: message.rows[0] });

  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    return res.status(500).json({ message: "Failed to send message." });
  }
});


/* =========================================================
   PATCH /api/messages/threads/:id/read
   ========================================================= */

router.patch("/threads/:id/read", authMiddleware, async (req, res) => {
  try {

    const threadId = parseInt(req.params.id, 10);

    await db.query(
      `UPDATE thread_members
          SET last_read_at = NOW()
        WHERE thread_id = $1
          AND user_id   = $2`,
      [threadId, req.userId]
    );

    await db.query(
      `UPDATE messages
          SET read_at = NOW()
        WHERE thread_id  = $1
          AND sender_id != $2
          AND read_at   IS NULL
          AND deleted_at IS NULL`,
      [threadId, req.userId]
    );

    return res.json({ ok: true });

  } catch (err) {
    console.error("MARK READ ERROR:", err);
    return res.status(500).json({ message: "Failed to mark as read." });
  }
});


/* =========================================================
   DELETE /api/messages/:id
   ========================================================= */

router.delete("/:id", authMiddleware, async (req, res) => {
  try {

    const messageId = parseInt(req.params.id, 10);

    const result = await db.query(
      `UPDATE messages
          SET deleted_at = NOW()
        WHERE id        = $1
          AND sender_id = $2
       RETURNING id`,
      [messageId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Message not found." });
    }

    return res.json({ ok: true });

  } catch (err) {
    console.error("DELETE MESSAGE ERROR:", err);
    return res.status(500).json({ message: "Failed to delete message." });
  }
});


module.exports = router;
