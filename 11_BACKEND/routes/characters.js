const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

/* =========================================================
   GET ALL CHARACTERS FOR USER
   ---------------------------------------------------------
   Returns summary list (no full sheet_data) for the
   character list page. Filtered by edition optionally.
   ========================================================= */

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { edition } = req.query;
    // e.g. GET /api/characters?edition=3.5e

    const query = edition
      ? `SELECT id, character_name, player_name, edition,
                created_at, updated_at, last_played_at
         FROM characters
         WHERE user_id = $1
         AND edition = $2
         AND is_deleted = FALSE
         ORDER BY updated_at DESC`
      : `SELECT id, character_name, player_name, edition,
                created_at, updated_at, last_played_at
         FROM characters
         WHERE user_id = $1
         AND is_deleted = FALSE
         ORDER BY updated_at DESC`;

    const params = edition ? [userId, edition] : [userId];
    const result = await pool.query(query, params);

    res.json({ success: true, characters: result.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "SERVER ERROR" });
  }
});


/* =========================================================
   GET SINGLE CHARACTER (full sheet data)
   ========================================================= */

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM characters
       WHERE id = $1
       AND user_id = $2
       AND is_deleted = FALSE`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "CHARACTER NOT FOUND" });
    }

    res.json({ success: true, character: result.rows[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "SERVER ERROR" });
  }
});


/* =========================================================
   CREATE NEW CHARACTER
   ========================================================= */

router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { edition = "3.5e", character_name, player_name, sheet_data = {} } = req.body;

    const result = await pool.query(
      `INSERT INTO characters
         (user_id, edition, character_name, player_name, sheet_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, character_name, edition, created_at`,
      [userId, edition, character_name, player_name, JSON.stringify(sheet_data)]
    );

    res.status(201).json({
      success: true,
      character: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "SERVER ERROR" });
  }
});


/* =========================================================
   SAVE / UPDATE CHARACTER
   ========================================================= */

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { character_name, player_name, sheet_data } = req.body;

    const result = await pool.query(
      `UPDATE characters
       SET
         character_name = $1,
         player_name    = $2,
         sheet_data     = $3,
         updated_at     = NOW()
       WHERE id = $4
       AND user_id = $5
       AND is_deleted = FALSE
       RETURNING id, updated_at`,
      [character_name, player_name, JSON.stringify(sheet_data), id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "CHARACTER NOT FOUND" });
    }

    res.json({ success: true, updated_at: result.rows[0].updated_at });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "SERVER ERROR" });
  }
});


/* =========================================================
   SOFT DELETE CHARACTER
   ========================================================= */

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await pool.query(
      `UPDATE characters
       SET is_deleted = TRUE, deleted_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({ success: true, message: "CHARACTER DELETED" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "SERVER ERROR" });
  }
});

module.exports = router;