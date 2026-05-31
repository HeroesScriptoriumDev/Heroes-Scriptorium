const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const pool   = require("../db");


// =====================================================
// REGISTER USER
// =====================================================

exports.registerUser = async (req, res) => {

  try {

    const {
      username,
      email,
      password
    } = req.body;


    // =================================================
    // CHECK IF USER EXISTS
    // =================================================

    const existingUser = await pool.query(
      `SELECT *
         FROM users
        WHERE email    = $1
           OR username = $2`,
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: "EMAIL OR USERNAME ALREADY EXISTS"
      });
    }


    // =================================================
    // HASH PASSWORD
    // =================================================

    const saltRounds  = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);


    // =================================================
    // INSERT USER
    // =================================================

    const newUser = await pool.query(
      `INSERT INTO users (
         username,
         email,
         password_hash
       )
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash]
    );

    const userId = newUser.rows[0].id;


    // =================================================
    // CREATE DEFAULT PROFILE
    // =================================================

    await pool.query(
      `INSERT INTO user_profiles (
         user_id,
         display_name,
         profile_setup_completed
       )
       VALUES ($1, $2, FALSE)`,
      [userId, username]
    );


    // =================================================
    // CREATE DEFAULT SETTINGS
    // =================================================

    await pool.query(
      `INSERT INTO user_settings (user_id)
       VALUES ($1)`,
      [userId]
    );


    // =================================================
    // CREATE JWT TOKEN
    // =================================================

    const token = jwt.sign(
      { user: { id: userId } },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );


    // =================================================
    // CREATE SESSION ROW
    // =================================================

    await pool.query(
      `INSERT INTO user_sessions (
         user_id,
         session_token,
         ip_address,
         user_agent,
         expires_at
       )
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')`,
      [
        userId,
        token,
        req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        req.headers["user-agent"] || ""
      ]
    );


    // =================================================
    // MARK ONLINE
    // =================================================

    await pool.query(
      `UPDATE users
          SET online_status = 'online',
              last_seen      = NOW()
        WHERE id = $1`,
      [userId]
    );


    // =================================================
    // RESPONSE
    // =================================================

    res.status(201).json({
      message: "USER REGISTERED",
      token,
      user: {
        id:         newUser.rows[0].id,
        username:   newUser.rows[0].username,
        email:      newUser.rows[0].email,
        created_at: newUser.rows[0].created_at
      }
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "SERVER ERROR" });

  }

};


// =====================================================
// LOGIN USER
// =====================================================

exports.loginUser = async (req, res) => {

  try {

    const { username, password } = req.body;


    // =================================================
    // FIND USER
    // =================================================

    const userQuery = await pool.query(
      `SELECT
          users.id,
          users.username,
          users.email,
          users.password_hash,
          user_profiles.profile_setup_completed
         FROM users
         LEFT JOIN user_profiles
           ON users.id = user_profiles.user_id
        WHERE users.username = $1
           OR users.email    = $1`,
      [username]
    );


    // =================================================
    // USER NOT FOUND
    // =================================================

    if (userQuery.rows.length === 0) {
      return res.status(400).json({ error: "INVALID USERNAME OR EMAIL" });
    }

    const user = userQuery.rows[0];


    // =================================================
    // CHECK PASSWORD
    // =================================================

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(400).json({ error: "INVALID PASSWORD" });
    }


    // =================================================
    // CREATE JWT TOKEN
    // =================================================

    const token = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );


    // =================================================
    // CREATE SESSION ROW
    // =================================================

    await pool.query(
      `INSERT INTO user_sessions (
         user_id,
         session_token,
         ip_address,
         user_agent,
         expires_at
       )
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')`,
      [
        user.id,
        token,
        req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        req.headers["user-agent"] || ""
      ]
    );


    // =================================================
    // MARK ONLINE
    // =================================================

    await pool.query(
      `UPDATE users
          SET online_status = 'online',
              last_seen      = NOW()
        WHERE id = $1`,
      [user.id]
    );


    // =================================================
    // RESPONSE
    // =================================================

    res.json({
      message: "LOGIN SUCCESSFUL",
      token,
      user: {
        id:                      user.id,
        username:                user.username,
        email:                   user.email,
        profile_setup_completed: user.profile_setup_completed
      }
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "SERVER ERROR" });

  }

};


// =====================================================
// LOGOUT USER
// =====================================================

exports.logoutUser = async (req, res) => {

  try {

    const { sessionToken } = req.body;


    // =================================================
    // MARK OFFLINE
    // =================================================

    await pool.query(
      `UPDATE users
          SET online_status = 'offline',
              last_seen      = NOW()
        WHERE id = $1`,
      [req.userId]
    );


    // =================================================
    // REVOKE SESSION
    // =================================================

    if (sessionToken) {
      await pool.query(
        `UPDATE user_sessions
            SET revoked = TRUE
          WHERE session_token = $1
            AND user_id       = $2`,
        [sessionToken, req.userId]
      );
    }


    // =================================================
    // RESPONSE
    // =================================================

    return res.json({ ok: true });

  } catch (error) {

    console.error("LOGOUT ERROR:", error);
    res.status(500).json({ error: "SERVER ERROR" });

  }

};
