const express = require("express");

const router = express.Router();

const pool = require("../db");


// =====================================================
// GET UPDATES
// =====================================================

router.get("/", async (req, res) => {

  try {

    const updates = await pool.query(`

      SELECT *

      FROM updates

      ORDER BY created_at DESC

      LIMIT 10

    `);

    res.json(updates.rows);

  }

  catch (error) {

    console.error(error);

    res.status(500).json({

      error: "FAILED TO LOAD UPDATES"

    });

  }

});

module.exports = router;