const crypto = require("crypto");

const ExpressError = require("./utils/ExpressError");
const { campgroundSchema, reviewSchema } = require("./schemas");
const { mysqlConnection } = require("./utils/mysql");

module.exports.campgroundJoiValidator = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    throw new ExpressError(errorMessage, 400);
  }

  next();
};

module.exports.reviewJoiValidator = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    throw new ExpressError(errorMessage, 400);
  }

  next();
};

module.exports.isSignedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;

    req.flash("error", "You must be signed in first!");

    return res.redirect("/signin");
  }

  next();
};

module.exports.isCampgroundAuthor = async (req, res, next) => {
  const id = req.params.id;
  const query = "SELECT user_id FROM campgrounds WHERE id = ?";

  mysqlConnection.query(query, [id], (error, result) => {
    if (error) next(error);

    if (result[0].user_id !== req.user.id) {
      req.flash("error", "You don't have permission for this action");

      return res.redirect(`/campgrounds/${id}`);
    }

    next();
  });
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const reviewId = req.params.reviewID;
  const campId = req.params.campID;

  mysqlConnection.query(
    "SELECT user_id FROM reviews WHERE id = ?",
    [reviewId],
    (error, result) => {
      if (error) next(error);

      if (result[0].user_id !== req.user.id) {
        req.flash("error", "You don't have permission for this action");

        return res.redirect(`/campgrounds/${campId}`);
      }

      next();
    }
  );
};

module.exports.validPassword = (password, hash, salt) => {
  var hashVerify = crypto
    .pbkdf2Sync(password, salt, 10000, 60, "sha512")
    .toString("hex");
  return hash === hashVerify;
};

module.exports.genPassword = (password) => {
  var salt = crypto.randomBytes(32).toString("hex");
  var genhash = crypto
    .pbkdf2Sync(password, salt, 10000, 60, "sha512")
    .toString("hex");
  return { salt: salt, hash: genhash };
};

module.exports.userExists = (req, res, next) => {
  mysqlConnection.query(
    "SELECT * FROM users WHERE username = ?",
    [req.body.user.username],
    function (error, results) {
      if (error) {
        return next(error);
      } else if (results.length > 0) {
        req.flash("error", "The username is in use!");

        return res.redirect("/signup");
      } else {
        next();
      }
    }
  );
};
