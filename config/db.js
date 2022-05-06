const mongoose = require('mongoose');

const dotenv = require('dotenv').config();
// require('dotenv').config();
// const config = require("./config/config");
// import connectDB from "../config/database";

const connectDB = async () => {
    try {
    mongoose.connect(process.env.DATABASE);
      console.log("MongoDB Connected...");
    } catch (err) {
      console.error(err.message);
      // Exit process with failure
      process.exit(1);
    }
  };

  module.exports.connectDB = connectDB;

