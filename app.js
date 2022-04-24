if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const secret = process.env.SESSION_SECRET || "yelpcampkey";

const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const helmet = require("helmet");
const MySQLStore = require("express-mysql-session")(session);

const ExpressError = require("./utils/ExpressError");
const funcErrorsWrapper = require("./utils/funcErrorsWrapper");
const campgroundRouter = require("./routes/campgrounds");
const reviewRouter = require("./routes/reviews");
const userRouter = require("./routes/users");
const { mysqlOptions, mysqlConnection } = require("./utils/mysql");
const { validPassword } = require("./middlewares");

const app = express();

mysqlConnection.connect();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(
  session({
    key: "yelpcampuser",
    secret,
    store: new MySQLStore(mysqlOptions),
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);
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
passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    (username, password, done) => {
      mysqlConnection.query(
        "SELECT * FROM users WHERE username = ?",
        [username],
        function (error, result) {
          if (error) return done(error);

          if (result.length == 0) {
            return done(null, false);
          }

          const isValid = validPassword(
            password,
            result[0].hash,
            result[0].salt
          );
          user = {
            id: result[0].id,
            username: result[0].username,
            email: result[0].email,
            hash: result[0].hash,
            salt: result[0].salt,
          };

          if (isValid) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        }
      );
    }
  )
);
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(function (userId, done) {
  mysqlConnection.query(
    "SELECT * FROM users WHERE id = ?",
    [userId],
    function (error, result) {
      done(null, result[0]);
    }
  );
});

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
