const express = require("express");
const multer = require("multer");

const funcErrorsWrapper = require("../utils/funcErrorsWrapper");
const {
  campgroundJoiValidator,
  isSignedIn,
  isCampgroundAuthor,
} = require("../middlewares");
const campgroundsController = require("../controllers/campgrounds");
const { storage } = require("../cloudinary");

const router = express.Router();
const upload = multer({ storage });

router.get("/", funcErrorsWrapper(campgroundsController.campgroundsList));

router
  .route("/new")
  .get(isSignedIn, funcErrorsWrapper(campgroundsController.campgroundNewGet))
  .post(
    isSignedIn,
    upload.array("image"),
    campgroundJoiValidator,
    funcErrorsWrapper(campgroundsController.campgroundNewPost)
  );

router
  .route("/:id")
  .get(funcErrorsWrapper(campgroundsController.campgroundShowGet))
  .delete(
    isSignedIn,
    isCampgroundAuthor,
    funcErrorsWrapper(campgroundsController.campgroundDelete)
  );

router
  .route("/:id/edit")
  .get(
    isSignedIn,
    isCampgroundAuthor,
    funcErrorsWrapper(campgroundsController.campgroundEditGet)
  )
  .put(
    isSignedIn,
    isCampgroundAuthor,
    upload.array("image"),
    campgroundJoiValidator,
    funcErrorsWrapper(campgroundsController.campgroundEditPut)
  );

module.exports = router;
