const express        = require("express");
const router         = express.Router();
const db             = require("../db");
const authMiddleware = require("../middleware/authMiddleware");


/* =========================================================
   GET /api/search/users
   ========================================================= */

router.get("/users", authMiddleware, async (req, res) => {
  try {

    const q     = (req.query.q || "").trim();
    const role  = (req.query.role || "").trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    if (q.length < 2) {
      return res.json({ users: [] });
    }

   const result = await db.query(
  `SELECT
      u.id,
      u.username,
      u.online_status,
      p.display_name,
      p.title,
      p.bio,
      p.pronouns
    FROM users u
    JOIN user_profiles p ON p.user_id = u.id
   WHERE u.id != $1
     AND (
       u.username ILIKE $2
       OR p.display_name ILIKE $2
     )
   ORDER BY
     CASE WHEN u.username ILIKE $3 THEN 0 ELSE 1 END,
     u.username ASC
   LIMIT $4`,
  [
    req.userId,
    `%${q}%`,
    `${q}%`,
    limit
  ]
);

    return res.json({ users: result.rows });

  } catch (err) {

    console.error("SEARCH ERROR FULL:", err);

    return res.status(500).json({
      message: err.message,
      detail: err.detail,
      code: err.code
    });

  }
}); 

module.exports = router;
