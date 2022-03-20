const express = require("express");

const router = express.Router({ mergeParams: true });

const funcErrorsWrapper = require("../utils/funcErrorsWrapper");
const {
  reviewJoiValidator,
  isSignedIn,
  isReviewAuthor,
} = require("../middlewares");
const reviewsController = require("../controllers/reviews");

router.post(
  "/",
  isSignedIn,
  reviewJoiValidator,
  funcErrorsWrapper(reviewsController.reviewPost)
);

router.delete(
  "/:reviewID",
  isSignedIn,
  isReviewAuthor,
  funcErrorsWrapper(reviewsController.reviewDelete)
);

module.exports = router;
