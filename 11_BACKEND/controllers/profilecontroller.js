/* =========================================================
   DATABASE CONNECTION
   ========================================================= */

const pool = require("../db");


/* =========================================================
   COMPLETE PROFILE SETUP
   ---------------------------------------------------------
   Used after:
   - registration
   - onboarding wizard

   This finalizes:
   - display name
   - bio
   - preferences
   - profile completion state
   ========================================================= */

exports.completeProfileSetup =
async (req, res) => {

  try {

    /* =====================================================
       AUTHENTICATED USER ID
       ===================================================== */

    const userId = req.user.id;


    /* =====================================================
       REQUEST BODY
       ===================================================== */

    const {
  display_name,
  bio,
  pronouns,
  avatar_url,
  timezone,
  language,
  theme
} = req.body;


    /* =====================================================
       BASIC VALIDATION
       ===================================================== */

    if(
      !display_name ||
      display_name.trim() === ""
    ){

      return res.status(400).json({
        error: "DISPLAY NAME REQUIRED"
      });

    }


    /* =====================================================
       UPDATE USER PROFILE
       ===================================================== */

    const updateResult = await pool.query(

  `
  UPDATE user_profiles

  SET

    display_name = $1,
    bio = $2,
    pronouns = $3,
    avatar_url = $4,
    profile_setup_completed = TRUE

  WHERE user_id = $5
  `,

  [

    display_name,
    bio,
    pronouns,
    avatar_url,
    userId

  ]

);

await pool.query(
  `
  UPDATE user_settings
  SET
    timezone = $1,
    language = $2,
    theme = $3
  WHERE user_id = $4
  `,
  [timezone || null, language || null, theme || null, userId]
);


    console.log(
      "Rows Updated:",
      updateResult.rowCount
    );

    const updatedProfile = await pool.query(
      `
      SELECT
      *
      FROM user_profiles
      WHERE user_id = $1
      `,
      [userId]
    );


    /* =====================================================
       CREATE COMMUNITY UPDATE
       -----------------------------------------------------
       This powers:
       - activity feeds
       - community updates
       - onboarding announcements
       ===================================================== */

    await pool.query(
      `
      INSERT INTO updates (

        update_type,
        title,
        content,
        icon,
        user_id,
        display_name

      )

      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [

        "community",

        "Community Update",

        `Welcome ${display_name}, newest member of Heroes Scriptorium. May your adventures be long and fruitful.`,

        "trophy",

        userId,

        display_name

      ]
    );


    /* =====================================================
       SUCCESS RESPONSE
       ===================================================== */

    res.json({

      success: true,

      message:
        "PROFILE SETUP COMPLETE"

    });

  }

  catch(error){

    console.error(error);

    res.status(500).json({

      error:
        "SERVER ERROR"

    });

  }

};


/* =========================================================
   GET PROFILE
   ---------------------------------------------------------
   Used by:
   - settings page
   - profile page
   - sidebar hydration
   - future dashboard systems

   Returns:
   - authenticated user profile data
   ========================================================= */

exports.getProfile =
async (req, res) => {

  try {

    /* =====================================================
       AUTHENTICATED USER ID
       ===================================================== */

    const userId = req.user.id;


    /* =====================================================
       DATABASE QUERY
       ===================================================== */

 const result = await pool.query(
  `
  SELECT
    users.id,
    users.username,
    users.email,
    users.created_at,
    user_profiles.display_name,
    user_profiles.title,
    user_profiles.bio,
    user_profiles.pronouns,
    user_profiles.avatar_url,
    user_profiles.profile_setup_completed,
    user_settings.timezone,
    user_settings.language,
    user_settings.theme
  FROM users
  JOIN user_profiles ON user_profiles.user_id = users.id
  LEFT JOIN user_settings ON user_settings.user_id = users.id
  WHERE users.id = $1
  `,
  [userId]
);


    /* =====================================================
       PROFILE NOT FOUND
       ===================================================== */

    if(result.rows.length === 0){

      return res.status(404).json({

        error:
          "PROFILE NOT FOUND"

      });

    }


    /* =====================================================
       PROFILE DATA
       ===================================================== */

    const profile =
      result.rows[0];


    /* =====================================================
       SUCCESS RESPONSE
       ===================================================== */

    res.json({

      success: true,

      profile

    });

  }

  catch(error){

    console.error(error);

    res.status(500).json({

      error:
        "SERVER ERROR"

    });

  }

};


/* =========================================================
   UPDATE PROFILE
   ---------------------------------------------------------
   Used by:
   - settings page
   - edit profile
   - onboarding edits
   - future profile customization

   IMPORTANT:
   ---------------------------------------------------------
   Only updates editable profile fields.
   ========================================================= */

exports.updateProfile =
async (req, res) => {

  try {

    /* =====================================================
       AUTHENTICATED USER ID
       ===================================================== */

    const userId = req.user.id;


    /* =====================================================
       REQUEST BODY
       ===================================================== */

    const {

      display_name,
      bio,
      pronouns,
      avatar_url,
      title,
      timezone,
      language,
      theme

    } = req.body;


    /* =====================================================
       VALIDATION
       ===================================================== */

    if(
      !display_name ||
      display_name.trim() === ""
    ){

      return res.status(400).json({

        error:
          "DISPLAY NAME REQUIRED"

      });

    }


    /* =====================================================
       UPDATE PROFILE
       ===================================================== */

// UPDATE user_profiles — only columns that exist there
await pool.query(
  `
  UPDATE user_profiles
  SET
    display_name = $1,
    bio = $2,
    pronouns = $3,
    avatar_url = $4,
    title = $5
  WHERE user_id = $6
  `,
  [display_name, bio, pronouns, avatar_url, title, userId]
);

// UPDATE user_settings — timezone, language, theme live here
await pool.query(
  `
  UPDATE user_settings
  SET
    language = $1,
    timezone = $2,
    theme = $3,
    updated_at = NOW()
  WHERE user_id = $4
  `,
  [language, timezone, theme, userId]
);

    /* =====================================================
       SUCCESS RESPONSE
       ===================================================== */

    res.json({

      success: true,

      message:
        "PROFILE UPDATED"

    });

  }

  catch(error){

    console.error(error);

    res.status(500).json({

      error:
        "SERVER ERROR"

    });

  }

};

