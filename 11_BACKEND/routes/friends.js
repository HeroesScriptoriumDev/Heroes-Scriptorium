

const express = require("express");
const router  = express.Router();
const db      = require("../db");           
const auth    = require("../middleware/authMiddleware");

router.use(auth);   


/* =========================================================
   HELPERS
   ========================================================= */

async function getFriendRow(userA, userB) {
  const { rows } = await db.query(
    `SELECT * FROM friends
     WHERE (requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1)
     LIMIT 1`,
    [userA, userB]
  );
  return rows[0] || null;
}

function deriveStatus(row, viewerId) {
  if (!row) return null;

  if (row.status === "blocked") {
    return row.blocked_by === viewerId ? "blocked_by_me" : "blocked_by_them";
  }
  if (row.status === "accepted") return "accepted";
  if (row.status === "pending") {
    return row.requester_id === viewerId ? "pending_sent" : "pending_received";
  }
  return null;
}




router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await db.query(
      `SELECT
         u.id,
         u.username AS display_name,
         u.online_status,
         u.last_seen,
         f.created_at AS friends_since
       FROM friends f
       JOIN users u ON (
         CASE
           WHEN f.requester_id = $1 THEN f.addressee_id
           ELSE f.requester_id
         END = u.id
       )
       WHERE (f.requester_id = $1 OR f.addressee_id = $1)
         AND f.status = 'accepted'
       ORDER BY u.username ASC`,
      [userId]
    );

    res.json({ friends: rows });

  } catch (err) {
    console.error("GET /api/friends error:", err);
    res.status(500).json({ error: "Failed to load friends." });
  }
});



router.get("/requests", async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await db.query(
      `SELECT
         f.id         AS request_id,
         f.created_at AS requested_at,
         u.id,
         u.username AS display_name,
         u.online_status
       FROM friends f
       JOIN users u ON u.id = f.requester_id
       WHERE f.addressee_id = $1
         AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ requests: rows });

  } catch (err) {
    console.error("GET /api/friends/requests error:", err);
    res.status(500).json({ error: "Failed to load requests." });
  }
});


router.get("/status/:targetId", async (req, res) => {
  try {
    const viewerId = req.user.id;
    const targetId = parseInt(req.params.targetId, 10);

    if (isNaN(targetId) || targetId === viewerId) {
      return res.json({ status: null });
    }

    const row    = await getFriendRow(viewerId, targetId);
    const status = deriveStatus(row, viewerId);

    res.json({ status });

  } catch (err) {
    console.error("GET /api/friends/status error:", err);
    res.status(500).json({ error: "Failed to fetch status." });
  }
});


router.post("/request/:targetId", async (req, res) => {
  try {
    const requesterId = req.user.id;
    const addresseeId = parseInt(req.params.targetId, 10);

    if (isNaN(addresseeId) || addresseeId === requesterId) {
      return res.status(400).json({ error: "Invalid target." });
    }

    /* Check for existing row */
    const existing = await getFriendRow(requesterId, addresseeId);

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(409).json({ error: "Already friends.", status: "accepted" });
      }
      if (existing.status === "pending") {
        /* If THEY already sent us a request — auto-accept */
        if (existing.requester_id === addresseeId) {
          await db.query(
            `UPDATE friends SET status = 'accepted', updated_at = NOW()
             WHERE id = $1`,
            [existing.id]
          );
          /* Update friend count for both users */
          await db.query(
            `UPDATE users SET friend_count = COALESCE(friend_count,0) + 1
             WHERE id = ANY($1::int[])`,
            [[requesterId, addresseeId]]
          );
          return res.json({ status: "accepted", message: "Friend request accepted." });
        }
        return res.status(409).json({ error: "Request already sent.", status: "pending_sent" });
      }
      if (existing.status === "blocked") {
        return res.status(403).json({ error: "Cannot send request.", status: "blocked" });
      }
    }

    /* Insert new pending request */
    await db.query(
      `INSERT INTO friends (requester_id, addressee_id, status)
       VALUES ($1, $2, 'pending')`,
      [requesterId, addresseeId]
    );

    /* Create a notification for the addressee */
    await db.query(
      `INSERT INTO notifications (user_id, type, actor_id, message, created_at)
       VALUES ($1, 'friend_request', $2, 'sent you a friend request.', NOW())
       ON CONFLICT DO NOTHING`,
      [addresseeId, requesterId]
    ).catch(() => { /* notifications table may not exist yet — silently skip */ });

    res.json({ status: "pending_sent", message: "Friend request sent." });

  } catch (err) {
    console.error("POST /api/friends/request error:", err);
    res.status(500).json({ error: "Failed to send request." });
  }
});


router.patch("/accept/:requesterId", async (req, res) => {
  try {
    const addresseeId = req.user.id;
    const requesterId = parseInt(req.params.requesterId, 10);

    const row = await getFriendRow(requesterId, addresseeId);

    if (!row || row.status !== "pending" || row.requester_id !== requesterId) {
      return res.status(404).json({ error: "No pending request found." });
    }

    await db.query(
      `UPDATE friends SET status = 'accepted', updated_at = NOW()
       WHERE id = $1`,
      [row.id]
    );

    /* Increment friend_count for both users */
    await db.query(
      `UPDATE users SET friend_count = COALESCE(friend_count, 0) + 1
       WHERE id = ANY($1::int[])`,
      [[requesterId, addresseeId]]
    );

    /* Notify the requester that request was accepted */
    await db.query(
      `INSERT INTO notifications (user_id, type, actor_id, message, created_at)
       VALUES ($1, 'friend_accepted', $2, 'accepted your friend request.', NOW())
       ON CONFLICT DO NOTHING`,
      [requesterId, addresseeId]
    ).catch(() => {});

    res.json({ status: "accepted", message: "Friend request accepted." });

  } catch (err) {
    console.error("PATCH /api/friends/accept error:", err);
    res.status(500).json({ error: "Failed to accept request." });
  }
});


router.patch("/decline/:requesterId", async (req, res) => {
  try {
    const addresseeId = req.user.id;
    const requesterId = parseInt(req.params.requesterId, 10);

    const row = await getFriendRow(requesterId, addresseeId);

    if (!row || row.status !== "pending" || row.requester_id !== requesterId) {
      return res.status(404).json({ error: "No pending request found." });
    }

    await db.query(`DELETE FROM friends WHERE id = $1`, [row.id]);

    res.json({ status: null, message: "Request declined." });

  } catch (err) {
    console.error("PATCH /api/friends/decline error:", err);
    res.status(500).json({ error: "Failed to decline request." });
  }
});

router.delete("/:targetId", async (req, res) => {
  try {
    const userId   = req.user.id;
    const targetId = parseInt(req.params.targetId, 10);

    const row = await getFriendRow(userId, targetId);

    if (!row || row.status !== "accepted") {
      return res.status(404).json({ error: "Friendship not found." });
    }

    await db.query(`DELETE FROM friends WHERE id = $1`, [row.id]);

    /* Decrement friend_count for both (floor at 0) */
    await db.query(
      `UPDATE users SET friend_count = GREATEST(COALESCE(friend_count, 1) - 1, 0)
       WHERE id = ANY($1::int[])`,
      [[userId, targetId]]
    );

    res.json({ status: null, message: "Friend removed." });

  } catch (err) {
    console.error("DELETE /api/friends error:", err);
    res.status(500).json({ error: "Failed to remove friend." });
  }
});


router.post("/block/:targetId", async (req, res) => {
  try {
    const blockerId = req.user.id;
    const blockedId = parseInt(req.params.targetId, 10);

    if (isNaN(blockedId) || blockedId === blockerId) {
      return res.status(400).json({ error: "Invalid target." });
    }

    const existing = await getFriendRow(blockerId, blockedId);

    if (existing) {
      /* If previously accepted, decrement counts */
      if (existing.status === "accepted") {
        await db.query(
          `UPDATE users SET friend_count = GREATEST(COALESCE(friend_count, 1) - 1, 0)
           WHERE id = ANY($1::int[])`,
          [[blockerId, blockedId]]
        );
      }
      /* Update the existing row to blocked */
      await db.query(
        `UPDATE friends
         SET status = 'blocked', blocked_by = $1, updated_at = NOW()
         WHERE id = $2`,
        [blockerId, existing.id]
      );
    } else {
      /* Insert fresh blocked row */
      await db.query(
        `INSERT INTO friends (requester_id, addressee_id, status, blocked_by)
         VALUES ($1, $2, 'blocked', $1)`,
        [blockerId, blockedId]
      );
    }

    res.json({ status: "blocked_by_me", message: "User blocked." });

  } catch (err) {
    console.error("POST /api/friends/block error:", err);
    res.status(500).json({ error: "Failed to block user." });
  }
});


router.post("/unblock/:targetId", async (req, res) => {
  try {
    const blockerId = req.user.id;
    const blockedId = parseInt(req.params.targetId, 10);

    const row = await getFriendRow(blockerId, blockedId);

    if (!row || row.status !== "blocked" || row.blocked_by !== blockerId) {
      return res.status(404).json({ error: "No active block found." });
    }

    await db.query(`DELETE FROM friends WHERE id = $1`, [row.id]);

    res.json({ status: null, message: "User unblocked." });

  } catch (err) {
    console.error("POST /api/friends/unblock error:", err);
    res.status(500).json({ error: "Failed to unblock user." });
  }
});


router.delete("/cancel/:targetId", async (req, res) => {
  try {
    const requesterId = req.user.id;
    const addresseeId = parseInt(req.params.targetId, 10);

    const row = await getFriendRow(requesterId, addresseeId);

    if (!row || row.status !== "pending" || row.requester_id !== requesterId) {
      return res.status(404).json({ error: "No outgoing request found." });
    }

    await db.query(`DELETE FROM friends WHERE id = $1`, [row.id]);

    res.json({ status: null, message: "Request cancelled." });

  } catch (err) {
    console.error("DELETE /api/friends/cancel error:", err);
    res.status(500).json({ error: "Failed to cancel request." });
  }
});


module.exports = router;
