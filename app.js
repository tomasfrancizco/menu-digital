require("dotenv").config();

const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

app.use(cookieParser());
app.use(express.json());

mongoose.connect(
  process.env.DB,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("Successfully connected to database");
  }
);

const userRouter = require("./routes/User");
app.use("/user", userRouter);

app.listen(5000, () => {
  console.log("Express server started");
});
