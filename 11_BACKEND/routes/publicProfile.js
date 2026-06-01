const express = require("express");

const router = express.Router();

const db = require("../db");

/* =====================================================
   GET PUBLIC PROFILE
   ===================================================== */

router.get("/:id", async (req, res) => {

    try {

        const result =
            await db.query(
                `
                SELECT

                    u.id,
                    u.username,
                    u.online_status,

                    p.display_name,
                    p.title,
                    p.bio,
                    p.pronouns,
                    p.avatar_url

                FROM users u

                LEFT JOIN user_profiles p
                ON p.user_id = u.id

                WHERE u.id = $1
                `,
                [req.params.id]
            );

        if (
            result.rows.length === 0
        ) {

            return res.status(404).json({

                message:
                    "User not found"

            });

        }

        res.json(
            result.rows[0]
        );

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Server error"

        });

    }

});

module.exports = router;
