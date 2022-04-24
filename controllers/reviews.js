const { mysqlConnection } = require("../utils/mysql");

module.exports = {
  reviewPost: async (req, res) => {
    const campID = req.params.campID;
    const review = {
      ...req.body.review,
      campground_id: campID,
      user_id: req.user.id,
    };

    mysqlConnection.query("INSERT INTO reviews SET ?", review, (error) => {
      if (error) next(error);

      res.redirect(`/campgrounds/${campID}`);
    });
  },
  reviewDelete: async (req, res) => {
    const { campID, reviewID } = req.params;

    mysqlConnection.query(
      "DELETE FROM reviews WHERE id = ?",
      reviewID,
      (error) => {
        if (error) next(error);

        res.redirect(`/campgrounds/${campID}`);
      }
    );
  },
};
