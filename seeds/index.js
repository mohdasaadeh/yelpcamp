const mongoose = require("mongoose");

const Campground = require("../models/campground");
const Review = require("../models/review");
const User = require("../models/user");
const cities = require("./cities");
const { places, descriptors } = require("./seedHelpers");

const mongoDB = mongoose.connection;

mongoose.connect("mongodb://localhost:27017/YelpCamp");
mongoDB.on("error", console.error.bind(console, "MongoDB connection error:"));
mongoDB.once("open", () => {
  console.log("Connecting to MongoDB...");
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
  await Campground.deleteMany({});
  await Review.deleteMany({});
  const author = await User.findOne({ username: "Mohammad" });
  for (let i = 0; i < 50; i++) {
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      location: `${sample(cities).city}, ${sample(cities).state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      image: [
        {
          url: "https://source.unsplash.com/collection/483251",
          filename: `seedImage_${i}`,
        },
      ],
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam dolores vero perferendis laudantium, consequuntur voluptatibus nulla architecto, sit soluta esse iure sed labore ipsam a cum nihil atque molestiae deserunt!",
      price,
      author,
      geometry: {
        type: "Point",
        coordinates: [sample(cities).longitude, sample(cities).latitude],
      },
    });
    await camp.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
});
