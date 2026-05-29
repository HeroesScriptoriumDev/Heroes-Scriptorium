const pool = require("../db/pool");

/* CREATE NEW CHARACTER */
async function createCharacter(req, res) {
  try {
    const userId = req.user?.id || 6;

    const result = await pool.query(
      `
      INSERT INTO characters
      (
        user_id,
        edition,
        character_name,
        player_name,
        sheet_data
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5
      )
      RETURNING id;
      `,
      [
        userId,
        "3.5e",
        "Unnamed Character",
        "",
        {}
      ]
    );

    res.json({
      success: true,
      characterId: result.rows[0].id
    });

  } catch (error) {
    console.error("Create character error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create character."
    });
  }
}

/* GET ALL CHARACTERS */
async function getCharacters(req, res) {
  try {
    const userId = req.user?.id || 6;

    const result = await pool.query(
      `
      SELECT
        id,
        edition,
        character_name,
        player_name,
        created_at,
        updated_at,
        last_played_at
      FROM characters
      WHERE user_id = $1
      AND is_deleted = false
      ORDER BY updated_at DESC;
      `,
      [userId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Get characters error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load characters."
    });
  }
}

/* GET ONE CHARACTER */
async function getCharacterById(req, res) {
  try {
    const userId = req.user?.id || 6;
    const characterId = req.params.id;

    const result = await pool.query(
      `
      SELECT *
      FROM characters
      WHERE id = $1
      AND user_id = $2
      AND is_deleted = false;
      `,
      [characterId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Character not found."
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Get character error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load character."
    });
  }
}

/* UPDATE CHARACTER */
async function updateCharacter(req, res) {
  try {
    const userId = req.user?.id || 6;
    const characterId = req.params.id;

    const {
      character_name,
      player_name,
      sheet_data
    } = req.body;

    await pool.query(
      `
      UPDATE characters
      SET
        character_name = $1,
        player_name = $2,
        sheet_data = $3,
        updated_at = NOW()
      WHERE id = $4
      AND user_id = $5;
      `,
      [
        character_name || "Unnamed Character",
        player_name || "",
        sheet_data || {},
        characterId,
        userId
      ]
    );

    res.json({
      success: true
    });

  } catch (error) {
    console.error("Update character error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save character."
    });
  }
}

/* SOFT DELETE CHARACTER */
async function softDeleteCharacter(req, res) {
  try {
    const userId = req.user?.id || 6;
    const characterId = req.params.id;

    await pool.query(
      `
      UPDATE characters
      SET
        is_deleted = true,
        deleted_at = NOW()
      WHERE id = $1
      AND user_id = $2;
      `,
      [characterId, userId]
    );

    res.json({
      success: true
    });

  } catch (error) {
    console.error("Delete character error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete character."
    });
  }
}

module.exports = {
  createCharacter,
  getCharacters,
  getCharacterById,
  updateCharacter,
  softDeleteCharacter
};