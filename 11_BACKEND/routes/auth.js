const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");


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


module.exports = router;