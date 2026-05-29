const express = require("express");

const router = express.Router();

const pool = require("../db");

const authMiddleware =
    require("../middleware/authMiddleware");


// =====================================================
// GET USER SETTINGS
// =====================================================

router.get(

    "/",

    authMiddleware,

    async (request, response) => {

        try {

            const userId = request.user.id;

            const result = await pool.query(

                `
                SELECT *
                FROM user_settings
                WHERE user_id = $1
                `,

                [userId]

            );

            response.json(result.rows[0]);

        } catch (error) {

            console.error(error);

            response.status(500).json({
                error: "Failed to load settings"
            });

        }

    }

);


// =====================================================
// UPDATE USER SETTINGS
// =====================================================

router.put(

    "/",

    authMiddleware,

    async (request, response) => {

        try {

            const userId = request.user.id;

            const {

                language,
                timezone,
                date_format,
                landing_page,

                email_notifications,
                forum_notifications,
                campaign_invites,
                session_reminders,

                profile_visibility,
                activity_visibility,

                theme,
                animated_backgrounds,
                compact_mode,

                reduced_motion,
                high_contrast,
                dyslexia_font

            } = request.body;


            await pool.query(

                `
                UPDATE user_settings

                SET

                    language = $1,
                    timezone = $2,
                    date_format = $3,
                    landing_page = $4,

                    email_notifications = $5,
                    forum_notifications = $6,
                    campaign_invites = $7,
                    session_reminders = $8,

                    profile_visibility = $9,
                    activity_visibility = $10,

                    theme = $11,
                    animated_backgrounds = $12,
                    compact_mode = $13,

                    reduced_motion = $14,
                    high_contrast = $15,
                    dyslexia_font = $16,

                    updated_at = NOW()

                WHERE user_id = $17
                `,

                [

                    language,
                    timezone,
                    date_format,
                    landing_page,

                    email_notifications,
                    forum_notifications,
                    campaign_invites,
                    session_reminders,

                    profile_visibility,
                    activity_visibility,

                    theme,
                    animated_backgrounds,
                    compact_mode,

                    reduced_motion,
                    high_contrast,
                    dyslexia_font,

                    userId

                ]

            );

            response.json({
                success: true
            });

        } catch (error) {

            console.error(error);

            response.status(500).json({
                error: "Failed to save settings"
            });

        }

    }

);

module.exports = router;