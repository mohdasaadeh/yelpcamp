const mysql = require("mysql");

const mysqlOptions = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: process.env.MYSQL_PASSWORD,
  database: "yelpcamp",
};

const mysqlConnection = mysql.createConnection(mysqlOptions);

module.exports = { mysqlOptions, mysqlConnection };
