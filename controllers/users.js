const { genPassword } = require("../middlewares");
const { mysqlConnection } = require("../utils/mysql");

module.exports = {
  signupGet: (req, res) => {
    res.render("auth/signup");
  },
  signupPost: async (req, res, next) => {
    try {
      const { username, email, password } = req.body.user;
      const saltHash = genPassword(password);
      const salt = saltHash.salt;
      const hash = saltHash.hash;

      mysqlConnection.query(
        "INSERT INTO users(username, email, hash, salt) VALUES(?, ?, ?, ?)",
        [username, email, hash, salt],
        (error) => {
          if (error) {
            if (error.code === "ER_DUP_ENTRY") {
              req.flash("error", "The email is in use!");

              return res.redirect("/signup");
            }

            return next(error);
          }

          mysqlConnection.query(
            "SELECT * FROM users WHERE username = ?",
            [username],
            (error, result) => {
              if (error) next(error);

              req.login(result[0], (error) => {
                if (error) next(error);

                req.flash("success", "Welcome to Yelp Camp!");

                res.redirect("/campgrounds");
              });
            }
          );
        }
      );
    } catch (error) {
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
