/* =========================================================
   PRESENCE ROUTES
   FILE: routes/presence.js

   ROUTES:
   PUT    /api/presence/status          — set online_status
   POST   /api/presence/heartbeat       — update last_active
   GET    /api/presence/:userId         — get a user's presence
   GET    /api/presence/sessions/mine   — get current user's sessions
   DELETE /api/presence/sessions/:id    — revoke one session
   POST   /api/presence/sessions/revoke-all — revoke all other sessions
   ========================================================= */

const express        = require("express");
const router         = express.Router();
const db             = require("../db");
const authMiddleware = require("../middleware/auth");

const VALID_STATUSES = ["online", "away", "busy", "invisible", "offline"];


/* =========================================================
   PUT /api/presence/status
   ---------------------------------------------------------
   Body: { status: "online" | "away" | "busy" | "invisible" }
   Updates online_status + last_seen for the authed user.
   Also accepts sendBeacon requests (content-type blob).
   ========================================================= */

router.put("/status", authMiddleware, async (req, res) => {
  try {

    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const result = await db.query(
      `UPDATE users
          SET online_status = $1,
              last_seen      = NOW()
        WHERE id = $2
       RETURNING online_status, last_seen`,
      [status, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json(result.rows[0]);

  } catch (err) {
    console.error("PRESENCE STATUS ERROR:", err);
    return res.status(500).json({ message: "Failed to update status." });
  }
});


/* =========================================================
   POST /api/presence/heartbeat
   ---------------------------------------------------------
   Called every 60s from the frontend.
   Updates last_seen on users table.
   Updates last_active on the matching session row.
   Auto-restores online if user was marked offline.
   ========================================================= */

router.post("/heartbeat", authMiddleware, async (req, res) => {
  try {

    const { sessionToken } = req.body;

    /* Update user last_seen; restore online if they were offline */
    await db.query(
      `UPDATE users
          SET last_seen     = NOW(),
              online_status = CASE
                WHEN online_status = 'offline' THEN 'online'
                ELSE online_status
              END
        WHERE id = $1`,
      [req.userId]
    );

    /* Keep session row alive */
    if (sessionToken) {
      await db.query(
        `UPDATE user_sessions
            SET last_active = NOW()
          WHERE session_token = $1
            AND user_id       = $2
            AND revoked       = FALSE
            AND expires_at    > NOW()`,
        [sessionToken, req.userId]
      );
    }

    return res.json({ ok: true });

  } catch (err) {
    console.error("HEARTBEAT ERROR:", err);
    return res.status(500).json({ message: "Heartbeat failed." });
  }
});


/* =========================================================
   GET /api/presence/sessions/mine
   ---------------------------------------------------------
   Returns all active non-expired sessions for the
   currently authed user. Used by the Sessions settings
   panel to show device list.
   ========================================================= */

router.get("/sessions/mine", authMiddleware, async (req, res) => {
  try {

    const result = await db.query(
      `SELECT
          id,
          ip_address,
          user_agent,
          created_at,
          last_active,
          expires_at
        FROM user_sessions
       WHERE user_id    = $1
         AND revoked    = FALSE
         AND expires_at > NOW()
       ORDER BY last_active DESC`,
      [req.userId]
    );

    return res.json({ sessions: result.rows });

  } catch (err) {
    console.error("SESSIONS FETCH ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch sessions." });
  }
});


/* =========================================================
   GET /api/presence/:userId
   ---------------------------------------------------------
   Returns another user's public presence.
   Invisible users appear as offline to everyone except
   themselves.
   ========================================================= */

router.get("/:userId", authMiddleware, async (req, res) => {
  try {

    const targetId = parseInt(req.params.userId, 10);

    if (isNaN(targetId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const result = await db.query(
      `SELECT
          online_status,
          last_seen
        FROM users
       WHERE id = $1`,
      [targetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const row = result.rows[0];

    /* Invisible users show as offline to everyone except themselves */
    const visibleStatus =
      row.online_status === "invisible" && targetId !== req.userId
        ? "offline"
        : row.online_status;

    return res.json({
      online_status: visibleStatus,
      last_seen:     row.last_seen,
    });

  } catch (err) {
    console.error("PRESENCE GET ERROR:", err);
    return res.status(500).json({ message: "Failed to get presence." });
  }
});


/* =========================================================
   DELETE /api/presence/sessions/:id
   ---------------------------------------------------------
   Revokes a single session by its row ID.
   Users can only revoke their own sessions.
   ========================================================= */

router.delete("/sessions/:id", authMiddleware, async (req, res) => {
  try {

    const sessionId = parseInt(req.params.id, 10);

    if (isNaN(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID." });
    }

    const result = await db.query(
      `UPDATE user_sessions
          SET revoked = TRUE
        WHERE id      = $1
          AND user_id = $2
       RETURNING id`,
      [sessionId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Session not found." });
    }

    return res.json({ ok: true, revoked: sessionId });

  } catch (err) {
    console.error("SESSION REVOKE ERROR:", err);
    return res.status(500).json({ message: "Failed to revoke session." });
  }
});


/* =========================================================
   POST /api/presence/sessions/revoke-all
   ---------------------------------------------------------
   Revokes all sessions except the current one so the
   user doesn't immediately log themselves out.
   Body: { currentSessionToken: "..." }
   ========================================================= */

router.post("/sessions/revoke-all", authMiddleware, async (req, res) => {
  try {

    const { currentSessionToken } = req.body;

    const result = await db.query(
      `UPDATE user_sessions
          SET revoked = TRUE
        WHERE user_id       = $1
          AND revoked       = FALSE
          AND session_token != $2
       RETURNING id`,
      [req.userId, currentSessionToken || ""]
    );

    return res.json({
      ok:      true,
      revoked: result.rows.length
    });

  } catch (err) {
    console.error("REVOKE ALL ERROR:", err);
    return res.status(500).json({ message: "Failed to revoke sessions." });
  }
});


module.exports = router;
