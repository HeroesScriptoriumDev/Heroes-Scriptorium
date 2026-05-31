const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");


// =====================================================
// REGISTER ROUTE
// =====================================================

router.post(

  "/register",

  authController.registerUser

);


// =====================================================
// LOGIN ROUTE
// =====================================================

router.post(

  "/login",

  authController.loginUser

);


// =====================================================
// LOGOUT ROUTE
// =====================================================

router.post(
  "/logout",
  authMiddleware, authController.logoutUser
);

module.exports = router;
