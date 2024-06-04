const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyparser = require("body-parser");
const bcrypt = require("bcrypt");
const exp = require("constants");
const collection = require("./src/config");
const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");
const mongoose = require("mongoose");
const morgan=require("morgan")
const nodemailer = require("nodemailer");
const nocache = require("nocache");
const validator = require('validator');
 const passport= require('passport')
 const passportSetup = require('./controllers/auth')
 const PDFDocument = require('pdfkit');
//  const Product = require('./models/product');

// require("./auth");

const app = express();
//convert data into json format
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(nocache());

  mongoose
 
  .connect(process.env.Mongo_env)
  .then(() => {
    console.log("DataBase connected");
  })
  .catch(() => {
    // console.log("DataBase Not Connected");
  });

app.use(
  session({
    secret: "your-Secret-Key",
    resave: false,

    saveUninitialized: true,
  })
); //creating session


//use EJS as the view engine

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//....<<<<<<<<<<<<<    Static file   >>>>>>>>>>>........



app.use(express.static("public"));
app.use("/images", express.static(path.resolve(__dirname, "images")));
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));
app.use("/", userRouter);
app.use("/admin", adminRouter);

// app.use('*',(req,res)=>{
//   res.render('user/errorpage')
// })

const port = process.env.PORT|| 5000;
app.listen(port, () => {
  console.log(`Server running on Port:${port}`);
});
