CREATE TABLE users(
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    salt VARCHAR(255) NOT NULL,
    hash VARCHAR(1500) NOT NULL
);

CREATE TABLE campgrounds(
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(50),
    price FLOAT(10, 2),
    description TEXT(1000),
    location VARCHAR(255),
    coordinates JSON NOT NULL,
    user_id INT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE campground_images(
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(255),
    filename VARCHAR(255),
    thumbnail VARCHAR(255) AS (REPLACE(url, "/upload/", "/upload/w_200/")),
    campground_id INT,
    user_id INT,
    FOREIGN KEY(campground_id) REFERENCES campgrounds(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE reviews(
    id INT AUTO_INCREMENT PRIMARY KEY,
    rating INT,
    body TEXT(500),
    campground_id INT,
    user_id INT,
    FOREIGN KEY(campground_id) REFERENCES campgrounds(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);