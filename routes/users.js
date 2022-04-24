const express = require("express");
const passport = require("passport");

const funcErrorsWrapper = require("../utils/funcErrorsWrapper");
const usersController = require("../controllers/users");
const { userExists } = require("../middlewares");

const router = express.Router();

// Sign Up
router
  .route("/signup")
  .get(funcErrorsWrapper(usersController.signupGet))
  .post(userExists, funcErrorsWrapper(usersController.signupPost));

// Sign In
router
  .route("/signin")
  .get(funcErrorsWrapper(usersController.signinGet))
  .post(
    passport.authenticate("local", {
      failureRedirect: "/signin",
      failureFlash: true,
    }),
    funcErrorsWrapper(usersController.signinPost)
  );

// Sign Out
router.get("/signout", funcErrorsWrapper(usersController.signout));

module.exports = router;
