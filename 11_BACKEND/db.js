const { Pool } = require("pg");

const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env")
});

console.log(
  "DB_USER:",
  process.env.DB_USER
);

console.log(
  "DB_PASSWORD:",
  process.env.DB_PASSWORD
);

const pool = new Pool({

  user: process.env.DB_USER,

  password: process.env.DB_PASSWORD,

  host: process.env.DB_HOST,

  port: process.env.DB_PORT,

  database: process.env.DB_NAME

});

pool.connect((error, client, release) => {

  if (error) {

    console.error("DATABASE CONNECTION FAILED");

    console.error(error.stack);

    return;

  }

  console.log("CONNECTED TO POSTGRESQL");

  release();

});

module.exports = pool;