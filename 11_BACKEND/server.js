const express = require("express");

const path = require("path");

const cors = require("cors");

require("dotenv").config();

const app = express();

const pool = require("./db");

const authRoutes = require("./routes/auth");

const profileRoutes = require("./routes/profile");

const updateRoutes = require('./routes/updates');

const settingsRoutes = require("./routes/settings");

const characterRoutes = require("./routes/characters");

const presenceRoutes = require("./routes/presence");
app.use("/api/presence", presenceRoutes);

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());


app.use(
  "/api/settings",
  settingsRoutes
);

app.use(
  "/api/characters",
  characterRoutes
);


// =====================================================
// STATIC FRONTEND FILES
// =====================================================

const frontendPath = path.join(
  __dirname,
  "../01_INDEX/01_INDEX"
);

app.use(express.static(frontendPath));


// =====================================================
// FRONTEND ROUTE
// =====================================================

app.get("/", (request, response) => {

  response.sendFile(

  path.join(

    __dirname,

    "../01_INDEX/01_INDEX/01_HTML/index_en.html"

  )

);

});


// =====================================================
// AUTH ROUTES
// =====================================================

app.use(

  "/api/auth",

  authRoutes,

);

app.use(

  "/api/profile",

  profileRoutes,

);

app.use(

  "/api/updates",

  updateRoutes
)


// =====================================================
// START SERVER
// =====================================================

app.listen(3000, () => {

  console.log("SERVER RUNNING ON PORT 3000");

});
