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

const messageRoutes = require("./routes/messages");

const searchRoutes = require("./routes/search");

const publicProfileRoute = require("./routes/publicProfile");

const friendsRouter = require('./routes/friends');

const campaignsRouter = require('./routes/campaigns');


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());



// =====================================================
// EXP & LEVELING CALCULATIONS
// =====================================================

function calculateXP(profile) {
  let xp = 0;

  xp += 50;

  if (profile.created_at) {
    const now = new Date();
    const created = new Date(profile.created_at);
    const diffMonths = (
      now.getFullYear() - created.getFullYear())  * 12 + 
      (now.getMonth() - created.getMonth());
    xp += Math.max(0, diffMonths) * 10;
  }

  xp += (profile.character_count || 0) * 25;
  xp += (profile.campaign_count || 0) * 40;
  xp += (profile.forum_post_count || 0) * 5;
  xp += (profile.friend_count || 0) * 10;
  xp += (profile.reputation || 0) * 15;

  return xp;

}

function calculateLevel(xp) {
  const thresholds = [
    { 
      level: 10,
      xp: 6500,
      title: "Immortal"
    },
    {
      level: 9,
      xp: 4500,
      title: "Mythic"
    },
    {
      level: 8,
      xp: 3000,
      title: "Legend"
    },
    {
      level: 7,
      xp: 2000,
      title: "Hero"
    },
    {
      level: 6,
      xp: 1400,
      title: "Champion"
    },
    {
      level: 5,
      xp: 900,
      title: "Veteran"
    },
    {
      level: 4,
      xp: 500,
      title: "Adventurer"
    },
    {
      level: 3,
      xp: 250,
      title: "Journeyman"
    },
    {
      level: 2,
      xp: 100,
      title: "Apprentice"
    },
    {
      level: 1,
      xp: 0,
      title: "Initiate"
    },
  ];

  for (const tier of thresholds) {
    if (xp >= tier.xp) {
      const currentIndex = thresholds.indexOf(tier);
      const nextTier = thresholds[currentIndex - 1] || null;
      const xpForNext = nextTier ? nextTier.xp : null;
      const xpProgress = nextTier
        ? Math.round(((xp - tier.xp) / (nextTier.xp - tier.xp)) * 100)
        : 100;

      return {
        level: tier.level,
        title: tier.title,
        xp,
        xp_for_next: xpForNext,
        progress: xpProgress
      };
    }
  }
}

  app.locals.calculateXP = calculateXP;
  app.locals.calculateLevel = calculateLevel;



// =====================================================
// MIDDLEWARE
// =====================================================


app.use(
  "/api/settings",
  settingsRoutes
);

app.use(
  "/api/characters",
  characterRoutes
);

app.use(
  "/api/presence", 
  presenceRoutes
);

app.use(
  "/api/messages",
  messageRoutes
);

app.use(
  "/api/search",
  searchRoutes
);

app.use(
  "/api/public-profile",
  publicProfileRoute
);

app.use(
  "/api/friends",
  friendsRouter
);

app.use(
  "/api/campaigns",
  campaignsRouter
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
