const mongoose = require("mongoose");

const cities = require("./cities");
const { places, descriptors } = require("./seedHelpers");

const mysql = require("mysql");

const mysqlOptions = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "***",
  database: "yelpcamp",
};

const mysqlConnection = mysql.createConnection(mysqlOptions);
mysqlConnection.connect();

const mongoDB = mongoose.connection;

mongoose.connect("mongodb://localhost:27017/YelpCamp");
mongoDB.on("error", console.error.bind(console, "MongoDB connection error:"));
mongoDB.once("open", () => {
  console.log("Connecting to MongoDB...");
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
  mysqlConnection.query("DELETE FROM campgrounds", (error) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Deleted");
    }

    mysqlConnection.query(
      "SELECT id FROM users WHERE username = ?",
      ["Mohammad"],
      (error, userResult) => {
        if (error) {
          console.log(error);
        } else {
          console.log("User Found");
        }

        for (let i = 1; i < 51; i++) {
          const price = Math.floor(Math.random() * 20) + 10;
          const campground = {
            title: `${sample(descriptors)} ${sample(places)}`,
            price,
            description:
              "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam dolores vero perferendis laudantium, consequuntur voluptatibus nulla architecto, sit soluta esse iure sed labore ipsam a cum nihil atque molestiae deserunt!",
            location: `${sample(cities).city}, ${sample(cities).state}`,
            coordinates: JSON.stringify([
              sample(cities).longitude,
              sample(cities).latitude,
            ]),
            user_id: userResult[0].id,
          };

          mysqlConnection.query(
            "INSERT INTO campgrounds SET ?",
            campground,
            (error) => {
              if (error) {
                console.log(error);
              } else {
                console.log("Campground Inserted");

                const campground_image = {
                  url: "https://source.unsplash.com/collection/483251",
                  filename: `seedImage_${i}`,
                  campground_id: i,
                  user_id: userResult[0].id,
                };

                mysqlConnection.query(
                  "INSERT INTO campground_images SET ?",
                  campground_image,
                  (error) => {
                    if (error) {
                      console.log(error);
                    } else {
                      console.log("Camp image inserted");
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  });
};

seedDB();
