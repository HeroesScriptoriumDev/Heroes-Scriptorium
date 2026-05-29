const express = require("express");

const router = express.Router();

const pool = require("../db");

const authMiddleware =
    require("../middleware/authMiddleware");

const profileController = require("../controllers/profilecontroller");

// =====================================================
// GET USER PROFILE
// =====================================================

router.get(
  "/",
  authMiddleware,
  profileController.getProfile
);


// =====================================================
// UPDATE USER PROFILE
// =====================================================

router.put(
  "/",
  authMiddleware,
  profileController.updateProfile
);

// =====================================================
// COMPLETE PROFILE SETUP
// =====================================================

router.post(
  "/setup",
  authMiddleware,
  profileController.completeProfileSetup
);

module.exports = router;