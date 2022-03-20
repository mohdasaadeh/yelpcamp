if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const mongoDbUrl =
  process.env.MONGODB_ATLAS || "mongodb://localhost:27017/YelpCamp";
const secret = process.env.SESSION_SECRET || "yelpcampkey";

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const MongoStore = require("connect-mongo");

const ExpressError = require("./utils/ExpressError");
const funcErrorsWrapper = require("./utils/funcErrorsWrapper");
const campgroundRouter = require("./routes/campgrounds");
const reviewRouter = require("./routes/reviews");
const userRouter = require("./routes/users");
const User = require("./models/user");

const app = express();
const mongoDB = mongoose.connection;
const mongoStore = MongoStore.create({
  mongoUrl: mongoDbUrl,
  secret,
  // Change after 24h if the sessions weren't changed.
  touchAfter: 24 * 60 * 60,
});
const sessionConfig = {
  store: mongoStore,
  name: "Hello",
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

// mongodb+srv://mohdasaadeh:<password>@cluster0.6ghbw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
// mongodb://localhost:27017/YelpCamp
mongoose.connect(mongoDbUrl);
mongoDB.on("error", console.error.bind(console, "MongoDB connection error:"));
mongoDB.once("open", () => {
  console.log("Connecting to MongoDB...");
});

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(mongoSanitize());
app.use(session(sessionConfig));
app.use(flash());
// helmet using and configuring
app.use(helmet());
const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com/",
  "https://api.tiles.mapbox.com/",
  "https://api.mapbox.com/",
  "https://kit.fontawesome.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
  "https://kit-free.fontawesome.com/",
  "https://stackpath.bootstrapcdn.com/",
  "https://api.mapbox.com/",
  "https://api.tiles.mapbox.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
];
const connectSrcUrls = [
  "https://api.mapbox.com/",
  "https://a.tiles.mapbox.com/",
  "https://b.tiles.mapbox.com/",
  "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: [
        "'self'",
        "blob:",
        "data:",
        "https://res.cloudinary.com/dvvk2zgur/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
        "https://source.unsplash.com/",
        "https://images.unsplash.com/",
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
    // crossOriginEmbedderPolicy: false,
  })
);
// Passport config
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// Locals
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;

  next();
});

// Routes
app.use("/campgrounds", campgroundRouter);
app.use("/campgrounds/:campID/reviews", reviewRouter);
app.use("/", userRouter);

app.get(
  "/",
  funcErrorsWrapper((req, res) => {
    res.redirect("/campgrounds");
  })
);

app.all("*", (req, res, next) => {
  throw new ExpressError("Page Not Found!", 404);
});

app.use((err, req, res, next) => {
  if (!err.message) err.message = "Something went wrong...";

  res.render("error", { err });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serving on port ${port}`);
});
