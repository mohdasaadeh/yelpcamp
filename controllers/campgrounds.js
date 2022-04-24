const { cloudinary } = require("../cloudinary");
const { mysqlConnection } = require("../utils/mysql");

// This config is only for the geocoding service from MapBox
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports = {
  campgroundsList: async (req, res, next) => {
    const query = `
    SELECT * FROM campgrounds 
      JOIN campground_images ON campgrounds.id = campground_images.campground_id 
        GROUP BY campgrounds.id
    `;

    mysqlConnection.query(query, (error, result) => {
      if (error) next(error);

      res.render("campgrounds/index", { campgrounds: result });
    });
  },
  campgroundNewGet: (req, res) => {
    res.render("campgrounds/new");
  },
  campgroundNewPost: async (req, res) => {
    const userId = req.user.id;
    const geoData = await geocoder
      .forwardGeocode({
        query: req.body.campground.location,
        limit: 1,
      })
      .send();
    const campground = {
      ...req.body.campground,
      coordinates: JSON.stringify(
        geoData.body.features[0].geometry.coordinates
      ),
      user_id: userId,
    };

    mysqlConnection.query(
      "INSERT INTO campgrounds SET ?",
      campground,
      (error, insertResult) => {
        if (error) next(error);

        const images = req.files.map((file) => ({
          url: file.path,
          filename: file.filename,
          campground_id: insertResult.insertId,
          user_id: userId,
        }));

        images.forEach((image) => {
          mysqlConnection.query(
            "INSERT INTO campground_images SET ?",
            image,
            (error) => {
              if (error) next(error);
            }
          );
        });

        req.flash("success", "The campground has been created successfully");

        res.redirect(`/campgrounds/${insertResult.insertId}`);
      }
    );
  },
  campgroundShowGet: async (req, res, next) => {
    const id = req.params.id;
    const campgroundQuery = `
    SELECT * FROM campgrounds 
      WHERE id = ${id}
    `;

    mysqlConnection.query(campgroundQuery, (error, campgroundResult) => {
      if (error) next(error);

      mysqlConnection.query(
        "SELECT * FROM users WHERE id = ?",
        [campgroundResult[0].user_id],
        (error, userResult) => {
          if (error) next(error);

          const imagesQuery = `
          SELECT * FROM campground_images 
            WHERE campground_id = ?
          `;

          mysqlConnection.query(
            imagesQuery,
            [campgroundResult[0].id],
            (error, imagesResult) => {
              if (error) next(error);

              const reviewsQuery = `
              SELECT * FROM reviews 
                JOIN users ON reviews.user_id = users.id 
                  WHERE campground_id = ?
              `;

              mysqlConnection.query(
                reviewsQuery,
                [campgroundResult[0].id],
                (error, reviewsResult) => {
                  if (error) next(error);
                  console.log(campgroundResult);
                  res.render("campgrounds/show", {
                    campground: campgroundResult[0],
                    user: userResult[0],
                    images: imagesResult,
                    reviews: reviewsResult,
                  });
                }
              );
            }
          );
        }
      );
    });
  },
  campgroundEditGet: async (req, res) => {
    const id = req.params.id;
    const campgroundQuery = `
    SELECT * FROM campgrounds 
      WHERE campgrounds.id = ${id}
    `;

    mysqlConnection.query(campgroundQuery, (error, campgroundResult) => {
      if (error) next(error);

      if (!campgroundResult[0]) {
        req.flash("error", "The campground couldn't be found!");
      }

      const imagesQuery = `
      SELECT * FROM campground_images 
        WHERE campground_id = ?
      `;

      mysqlConnection.query(
        imagesQuery,
        [campgroundResult[0].id],
        (error, imagesResult) => {
          if (error) next(error);

          res.render("campgrounds/edit", {
            campground: campgroundResult[0],
            images: imagesResult,
          });
        }
      );
    });
  },
  campgroundEditPut: async (req, res, next) => {
    const id = req.params.id;
    const userId = req.user.id;
    const deletedImages = req.body.deletedImages;
    const geoData = await geocoder
      .forwardGeocode({
        query: req.body.campground.location,
        limit: 1,
      })
      .send();
    const campground = {
      ...req.body.campground,
      coordinates: JSON.stringify(
        geoData.body.features[0].geometry.coordinates
      ),
    };
    const campgroundQuery = `
    UPDATE campgrounds 
      SET ?
        WHERE id = ${id}
    `;

    mysqlConnection.query(campgroundQuery, campground, async (error) => {
      if (error) next(error);

      const images = req.files.map((file) => ({
        url: file.path,
        filename: file.filename,
        campground_id: id,
        user_id: userId,
      }));
      const imagesQuery = `
        INSERT INTO campground_images 
          SET ?
      `;

      images.forEach((image) => {
        mysqlConnection.query(imagesQuery, image, (error) => {
          if (error) next(error);
        });
      });

      if (deletedImages) {
        for (let img of deletedImages) {
          await cloudinary.uploader.destroy(img);

          mysqlConnection.query(
            "DELETE FROM campground_images WHERE filename = ?",
            img,
            (error) => {
              if (error) next(error);
            }
          );
        }
      }

      res.redirect(`/campgrounds/${id}`);
    });
  },
  campgroundDelete: async (req, res) => {
    const campgroundId = req.params.id;
    mysqlConnection.query(
      "DELETE FROM campgrounds WHERE id = ?",
      campgroundId,
      (error) => {
        if (error) next(error);

        mysqlConnection.query(
          "SELECT * FROM campground_images WHERE campground_id = ?",
          campgroundId,
          async (error, imagesResult) => {
            if (error) next(error);

            for (let img of imagesResult) {
              await cloudinary.uploader.destroy(img);
            }

            res.redirect("/campgrounds");
          }
        );
      }
    );
  },
};
