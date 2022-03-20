const Campground = require("../models/campground");
const { cloudinary } = require("../cloudinary");

// This config is only for the geocoding service from MapBox
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports = {
  campgroundsList: async (req, res) => {
    const campgrounds = await Campground.find();

    res.render("campgrounds/index", { campgrounds });
  },
  campgroundNewGet: (req, res) => {
    res.render("campgrounds/new");
  },
  campgroundNewPost: async (req, res) => {
    const geoData = await geocoder
      .forwardGeocode({
        query: req.body.campground.location,
        limit: 1,
      })
      .send();
    const campground = new Campground(req.body.campground);
    campground.author = req.user;
    campground.image = req.files.map((file) => ({
      url: file.path,
      filename: file.filename,
    }));
    campground.geometry = geoData.body.features[0].geometry;

    const newCampground = await campground.save();

    req.flash("success", "The campground has been created successfully");

    res.redirect(`/campgrounds/${newCampground._id}`);
  },
  campgroundShowGet: async (req, res, next) => {
    const id = req.params.id;
    const foundCampground = await Campground.findById(id)
      .populate({
        path: "reviews",
        populate: { path: "author" },
      })
      .populate("author");

    if (!foundCampground) {
      req.flash("error", "The campground couldn't be found!");
      return res.redirect("/campgrounds");
    }

    res.render("campgrounds/show", { foundCampground });
  },
  campgroundEditGet: async (req, res) => {
    const id = req.params.id;
    const foundCampground = await Campground.findById(id);

    if (!foundCampground) {
      req.flash("error", "The campground couldn't be found!");
    }

    res.render("campgrounds/edit", { foundCampground });
  },
  campgroundEditPut: async (req, res) => {
    const id = req.params.id;
    const deletedImages = req.body.deletedImages;

    const campground = await Campground.findByIdAndUpdate(
      id,
      req.body.campground
    );

    const imgs = req.files.map((file) => ({
      url: file.path,
      filename: file.filename,
    }));
    campground.image.push(...imgs);

    await campground.save();

    if (deletedImages) {
      for (let img of deletedImages) {
        await cloudinary.uploader.destroy(img);
      }

      await campground.updateOne({
        $pull: { image: { filename: { $in: deletedImages } } },
      });
    }

    res.redirect(`/campgrounds/${campground._id}`);
  },
  campgroundDelete: async (req, res) => {
    await Campground.findByIdAndDelete(req.params.id);

    res.redirect("/campgrounds");
  },
};
