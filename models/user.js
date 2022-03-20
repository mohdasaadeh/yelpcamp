const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const Schema = mongoose.Schema;

// The password and username fields aren't added because passport takes
// care of adding their fields (salt & hash regarding the password).
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

// Adding the passport-local-mongoose library as plugin
userSchema.plugin(passportLocalMongoose);

// Customizing an error message for the not unique emails
userSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.keyPattern.email === 1) {
    next(new Error("A user with the given email is already registered"));
  } else {
    next();
  }
});

module.exports = mongoose.model("User", userSchema);
