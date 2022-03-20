const User = require("../models/user");

module.exports = {
  signupGet: (req, res) => {
    res.render("auth/signup");
  },
  signupPost: async (req, res, next) => {
    try {
      const user = req.body.user;
      const newUser = await new User({
        username: user.username,
        email: user.email,
      });
      const signedUpUser = await User.register(newUser, user.password);

      req.login(signedUpUser, (error) => {
        if (error) next(error);

        req.flash("success", "Welcome to Yelp Camp!");
        res.redirect("/campgrounds");
      });
    } catch (error) {
      console.dir(error);
      req.flash("error", error.message);
      res.redirect("/signup");
    }
  },
  signinGet: (req, res) => {
    if (req.isAuthenticated()) {
      req.flash("success", "You are already signed in!");
      return res.redirect("/campgrounds");
    }
    res.render("auth/signin");
  },
  signinPost: (req, res) => {
    req.flash("success", "Welcome back");

    const redirectURL = req.session.returnTo || "/campgrounds";
    delete req.session.returnTo;

    res.redirect(redirectURL);
  },
  signout: (req, res) => {
    req.logOut();
    req.flash("success", "Goodbye!");
    res.redirect("/campgrounds");
  },
};
