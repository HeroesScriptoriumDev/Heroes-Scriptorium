const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const pool = require("../db");


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

      `

      SELECT *

      FROM users

      WHERE email = $1

      OR username = $2

      `,

      [

        email,
        username

      ]

    );


    if (existingUser.rows.length > 0) {

      return res.status(400).json({

        error: "EMAIL OR USERNAME ALREADY EXISTS"

      });

    }


    // =================================================
    // HASH PASSWORD
    // =================================================

    const saltRounds = 10;

    const passwordHash = await bcrypt.hash(

      password,

      saltRounds

    );


    // =================================================
    // INSERT USER
    // =================================================

    const newUser = await pool.query(

      `

      INSERT INTO users (

        username,
        email,
        password_hash

      )

      VALUES ($1, $2, $3)

      RETURNING id, username, email, created_at

      `,

      [

        username,
        email,
        passwordHash

      ]

    );


    // =================================================
    // USER ID
    // =================================================

    const userId =
      newUser.rows[0].id;


    // =================================================
    // CREATE DEFAULT PROFILE
    // =================================================

    await pool.query(

      `

      INSERT INTO user_profiles (

        user_id,
        display_name,
        profile_setup_completed

      )

      VALUES ($1, $2, FALSE)

      `,

      [

        userId,
        username

      ]

    );


    // =================================================
    // CREATE DEFAULT SETTINGS
    // =================================================

    await pool.query(

      `

      INSERT INTO user_settings (

        user_id

      )

      VALUES ($1)

      `,

      [userId]

    );


    // =================================================
    // CREATE JWT TOKEN
    // =================================================

    const token = jwt.sign(

  {

    user: {

      id: newUser.rows[0].id

    }

  },

  process.env.JWT_SECRET,

  {

    expiresIn: "7d"

  }

);


    // =================================================
    // RESPONSE
    // =================================================

    res.status(201).json({

      message: "USER REGISTERED",

      token,

      user: {

        id: newUser.rows[0].id,

        username: newUser.rows[0].username,

        email: newUser.rows[0].email,

        created_at: newUser.rows[0].created_at

      }

    });

  }

  catch (error) {

    console.error(error);

    res.status(500).json({

      error: "SERVER ERROR"

    });

  }

};


// =====================================================
// LOGIN USER
// =====================================================

exports.loginUser = async (req, res) => {

  try {

    const {

      username,
      password

    } = req.body;


    // =================================================
    // FIND USER
    // =================================================

    const userQuery = await pool.query(

      `

      SELECT

        users.id,
        users.username,
        users.email,
        users.password_hash,

        user_profiles.profile_setup_completed

      FROM users

      LEFT JOIN user_profiles

      ON users.id = user_profiles.user_id

      WHERE users.username = $1

      OR users.email = $1

      `,

      [username]

    );


    // =================================================
    // USER NOT FOUND
    // =================================================

    if (userQuery.rows.length === 0) {

      return res.status(400).json({

        error: "INVALID USERNAME OR EMAIL"

      });

    }


    const user =
      userQuery.rows[0];


    // =================================================
    // CHECK PASSWORD
    // =================================================

    const validPassword = await bcrypt.compare(

      password,

      user.password_hash

    );


    if (!validPassword) {

      return res.status(400).json({

        error: "INVALID PASSWORD"

      });

    }


    // =================================================
    // CREATE JWT TOKEN
    // =================================================

    const token = jwt.sign(

  {

    user: {

      id: user.id

    }

  },

  process.env.JWT_SECRET,

  {

    expiresIn: "7d"

  }

);


    // =================================================
    // RESPONSE
    // =================================================

    res.json({

      message: "LOGIN SUCCESSFUL",

      token,

      user: {

        id: user.id,

        username: user.username,

        email: user.email,

        profile_setup_completed: user.profile_setup_completed

      }

    });

  }

  catch (error) {

    console.error(error);

    res.status(500).json({

      error: "SERVER ERROR"

    });

  }

};