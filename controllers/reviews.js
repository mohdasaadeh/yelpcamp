const Review = require("../models/review");
const Campground = require("../models/campground");

module.exports = {
  reviewPost: async (req, res) => {
    const campID = req.params.campID;

    const review = new Review(req.body.review);
    review.author = req.user;
    const foundCampground = await Campground.findById(campID);
    foundCampground.reviews.push(review);

    await foundCampground.save();
    await review.save();

    res.redirect(`/campgrounds/${campID}`);
  },
  reviewDelete: async (req, res) => {
    const { campID, reviewID } = req.params;

    await Campground.findByIdAndUpdate(campID, {
      $pull: { reviews: reviewID },
    });
    await Review.findByIdAndDelete(reviewID);

    res.redirect(`/campgrounds/${campID}`);
  },
};
