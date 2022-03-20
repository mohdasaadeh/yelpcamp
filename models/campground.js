const mongoose = require("mongoose");

const Review = require("./review");
const { cloudinary } = require("../cloudinary");

const Schema = mongoose.Schema;
// This variable should be added as a second argument to the schema below so the virtuals
// can be converted to JSON when we convert the documents.
const opts = { toJSON: { virtuals: true } };

const imageSchema = new Schema({
  url: String,
  filename: String,
});
//Adding a virtual property of url with a resized image
imageSchema.virtual("thumbnail").get(function () {
  return this.url.replace("/upload/", "/upload/w_200/");
});

const campgroundSchema = new Schema(
  {
    title: String,
    image: [imageSchema],
    price: Number,
    description: String,
    location: String,
    geometry: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: { type: [Number], required: true },
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  opts
);

// Even though I'm using findByIdAndDelete method to delete campgrounds
// I've used here findOneAndDelete because it's available by Mongoose
// and includes findByIdAndDelete.
campgroundSchema.post("findOneAndDelete", async (doc) => {
  if (doc) {
    // Deleting the reviews from reviews collection
    await Review.deleteMany({ _id: { $in: doc.reviews } });

    // Deleting the images from Cloudinary if any
    for (let image of doc.image) {
      await cloudinary.uploader.destroy(image.filename);
    }
  }
});

campgroundSchema.virtual("properties.popUpMarkup").get(function () {
  return `
  <strong><a href="/campgrounds/${this._id}">${this.title}</a><strong>
  <p>${this.description.substring(0, 20)}...</p>`;
});

module.exports = mongoose.model("Campground", campgroundSchema);
