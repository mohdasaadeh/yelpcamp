const Campground = require("./models/campground");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError");
const { campgroundSchema, reviewSchema } = require("./schemas");

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

  const foundCampground = await Campground.findById(id).populate("author");

  if (!foundCampground.author.equals(req.user)) {
    req.flash("error", "You don't have permission for this action");

    return res.redirect(`/campgrounds/${id}`);
  }

  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const id = req.params.reviewID;

  const foundReview = await Campground.findById(id).populate("author");

  if (!foundReview.author.equals(req.user)) {
    req.flash("error", "You don't have permission for this action");

    return res.redirect(`/campgrounds/${id}`);
  }

  next();
};
