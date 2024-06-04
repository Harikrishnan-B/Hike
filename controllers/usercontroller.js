const session = require("express-session");
const mongoose = require("mongoose");
const collection = require("../models/user");
const otp = require("../models/otp");
const bcrypt = require("bcrypt");
const validator = require("validator");
const bodyparser = require("body-parser");
const Products = require("../models/product");
const Category = require("../models/category");
// const Rating = require("../models/rating");
const Order = require("../models/order");
const Coupon = require("../models/coupon");
const otpgenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const { userBlocked, couponDelete } = require("./admincontroller");
const Razorpay = require("razorpay");
const { createInvoice } = require('../config/invoice');
const PDFDocument = require('pdfkit');
const path = require("path");
const fs = require('fs');

require("dotenv").config();
const passport = require("passport");
const product = require("../models/product");
const category = require("../models/category");
// const category = require("../models/category");
// const { default: products } = require('razorpay/dist/types/products');

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const signup = (req, res) => {
  res.render("user/signup");
};

// const homebeforelogin = async (req, res) => {
//   const products = await Products.find({});
//   const category = await Category.find({});
//   console.log("products", products);
//   res.render("user/Home2", { products, category });
// };

const homebeforelogin = async (req, res) => {
  try {
    let sortOption = req.query.sort || "";
    let sortCriteria = {};
    if (sortOption === "AZ") {
      sortCriteria = { name: 1 };
    } else if (sortOption === "ZA") {
      sortCriteria = { name: -1 };
    }
    const products = await Products.find().sort(sortCriteria);
    const productId = req.params.id;
    const product = await Products.findById(productId);
    const category = await Category.find();
    const searchQuery = req.query.search || "";

    // Fetch wishlist from the database
  
    // const wishlist = userId ? await wishlist.find({ userId }) : []; 

    res.render("user/Home2", {
      products,
      product,
      category,
      searchQuery,
      // wishlist
    });
  } catch (error) {
    console.error(error);
    res.render("user/errorpage");
  }
};


const signuppost = async (req, res) => {
  console.log("hi");
  try {
    const data = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      password: req.body.password,
    };
    req.session.data = data;

    const existingUser = await collection.findOne({ email: data.email });

    if (existingUser) {
      res.send("This account already exists");
      return;
    }

    // Save the new user data
    // const newUser = new collection1(data);
    // await newUser.save();

    //   const newUser = new collection({
    //   firstName: data.firstname,
    //   lastName: data.lastname,
    //   email: data.email,
    //   password: data.password,
    // });
    // Sending email
    await mailsender(data);

    res.render("user/otp");
  } catch (error) {
    console.error("Error in signuppost:", error);
    // res.status(500).send("Internal Server Error");
    res.render("/user/errorpage");
  }
};

const forgetPassword = async (req, res) => {
  try {
    res.render("user/forgetPassword", { message: "" });
  } catch (error) {}
};

const forgetPasswordPost = async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await collection.findOne({ email: email });

    if (!existingUser) {
      return res.render("user/forgetPassword", { message: "User not found" });
    } else {
      const data = {
        email: email,
      };
      req.session.data = email;
      await mailsender(data);
      res.redirect("/forgetPassOTP");
    }
    console.log(email);
  } catch (error) {}
};

const forgetPassOTP = async (req, res) => {
  try {
    res.render("user/forgetPassOTP");
  } catch (error) {}
};

const forgetPassOTPpost = async (req, res) => {
  try {
    const latestOtp = await otp.findOne({}).sort({ _id: -1 }).limit(1);
    const otpValue = req.body.otp;
    console.log(otpValue);
    if (latestOtp.otp == otpValue) {
      // console.log(req.session.data);

      res.json({ success: true, message: "OTP verification successful" });
    } else {
      res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  } catch (error) {}
};

const forgetPasswordPage = async (req, res) => {
  try {
    res.render("user/forgetPassPage");
  } catch (error) {}
};

const forgetPasswordPagePost = async (req, res) => {
  try {
    const { newPassword } = req.body;
    let user = await collection.findOne({ email: req.session.data });
    console.log(user);
    console.log(newPassword);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await collection.updateOne(
      { email: req.session.data },
      { $set: { password: newPassword } }
    );
    return res.redirect("/login");
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const loginget = (req, res) => {
  if (req.session.user) {
    res.redirect("/home");
  } else {
    let error = "";
    res.render("user/login", { error });
  }
};

const loginpost = async (req, res) => {
  console.log(req.body);
  if (!req.body.email || !req.body.password) {
    return res
      .status(400)
      .render("user/login", { error: "Username and password are required." });
  }

  const trimmedData = {
    email: req.body.email.trim(),
    password: req.body.password.trim(),
  };

  try {
    const user = await collection.findOne({ email: trimmedData.email });

    if (!user) {
      return res
        .status(400)
        .render("user/login", { error: "User not found", data: trimmedData });
    }

    if (user.isBlocked) {
      return res
        .status(400)
        .render("user/login", {
          error: "You are Blocked by Admin",
          data: trimmedData,
        });
    }
    const passwordMatch = trimmedData.password == user.password;

    console.log(passwordMatch);

    if (!passwordMatch) {
      return res
        .status(400)
        .render("user/login", {
          error: "Invalid username or password.",
          data: trimmedData,
        });
    }
    req.session.user = trimmedData.email;
    res.redirect("/home");
  } catch (error) {
    console.error("Error logging in:", error);
    res
      .status(500)
      .render("user/login", {
        error: "Internal server error.",
        data: trimmedData,
      });
  }
};

const loginAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

const loginAuthRedirect = (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      console.log(user, "hello auth1.1");
      return next(err);
      }
    if (!user) {
      console.log(user, "hello auth1");
      return res.redirect("/login");
      } 
    req.logIn(user, (err) => {
      if (err) {
        console.log(user, "hello auth2");
        return next(err);
      }
      console.log(user, "hello auth");
      req.session.user = user.email;
      return res.redirect("/home"); // Redirect to profile page if authentication is successful
    });
  })(req, res, next);
};

const home = async (req, res) => {
  const User = req.session.user;
  const user = await collection.find({ email: User });
  try {
    let sortOption = req.query.sort || "";
    let sortCriteria = {};
    if (sortOption === "AZ") {
      sortCriteria = { name: 1 };
    } else if (sortOption === "ZA") {
      sortCriteria = { name: -1 };
    }

    const products = await Products.find().sort(sortCriteria);
    const productId = req.params.id;
    const product = await Products.findById(productId);
    const category = await Category.find();
    const searchQuery = req.query.search || "";

    res.render("user/home", {
      products,
      product,
      category,
      searchQuery,
      wishlist: user[0].wishlist,
    });
  } catch (error) {
    console.error(error);
    res.render("user/errorpage");
  }
};

const homePost = async (req, res) => {
  try {
    res.render("/SneakersHome");
  } catch (error) {}
};

const clogHome = async (req, res) => {
  const products = await Products.find({});
  const category = await Category.find({});
  res.render("user/ClogsHome", { products, category });
};




// const LeatherHome = async (req, res) => {
//   const User = req.session.user;
//   const user = await collection.find({ email: User });
//   try {
//     const minPrice = parseInt(req.query.minPrice) || 0;
//     const maxPrice = parseInt(req.query.maxPrice) || 100000;
//     const sortBy = req.query.sortBy || ''; 
//     const page = parseInt(req.query.page) || 1; 
//     const productsPerPage = 8; 
//     const skip = (page - 1) * productsPerPage;

//     let sortCriteria = {};
//     if (sortBy === 'name_asc') {
//       sortCriteria = { name: 1 }; // Sort by name A-Z
//     } else if (sortBy === 'name_desc') {
//       sortCriteria = { name: -1 }; // Sort by name Z-A
//     } else if (sortBy === 'price_asc') {
//       sortCriteria = { price: 1 }; // Sort by price low to high
//     } else if (sortBy === 'price_desc') {
//       sortCriteria = { price: -1 }; // Sort by price high to low
//     }

//     let products = await Products.find({
//       category: "leather",
//       price: {$gte: minPrice, $lte: maxPrice },
//     }).sort(sortCriteria).skip(skip).limit(productsPerPage);

//     const category = await Category.find({});
//     const totalProducts = await Products.countDocuments({
//       category: "leather",
//       price: { $gte: minPrice, $lte: maxPrice },
//     });
//     const totalPages = Math.ceil(totalProducts / productsPerPage); 
//     res.render("user/LeatherHome", {
//       products,
//       category,
//       totalPages,
//       currentPage: page,
//       minPrice,
//       maxPrice,
//       sortBy,
//       totalProducts,
//       wishlist: user[0].wishlist ,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// };


const LeatherHome = async (req, res) => {
  const User = req.session.user;
  const user = await collection.find({ email: User });
  let wishlist = null;
  if (user && user.length > 0) {
    wishlist = user[0].wishlist;
  }
  try {
    const minPrice = parseInt(req.query.minPrice) || 0;
    const maxPrice = parseInt(req.query.maxPrice) || 100000;
    const sortBy = req.query.sortBy || ''; 
    const page = parseInt(req.query.page) || 1; 
    const productsPerPage = 8; 
    const skip = (page - 1) * productsPerPage;

    let sortCriteria = {};
    if (sortBy === 'name_asc') {
      sortCriteria = { name: 1 }; 
    } else if (sortBy === 'name_desc') {
      sortCriteria = { name: -1 }; 
    } else if (sortBy === 'price_asc') {
      sortCriteria = { price: 1 }; 
    } else if (sortBy === 'price_desc') {
      sortCriteria = { price: -1 }; 
    }

    let products = await Products.find({
      category: "leather",
      price: { $gte: minPrice, $lte: maxPrice },
    }).sort(sortCriteria).skip(skip).limit(productsPerPage);
    const category = await Category.find({});
    const totalProducts = await Products.countDocuments({
      category: "leather",
      price: { $gte: minPrice, $lte: maxPrice },
    });
    const totalPages = Math.ceil(totalProducts / productsPerPage); 
    res.render("user/LeatherHome", {
      products,
      category,
      totalPages,
      currentPage: page,
      minPrice,
      maxPrice,
      sortBy,
      totalProducts,
      wishlist,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


const Sports = async (req, res) => {
  const User = req.session.user;
  const user = await collection.find({ email: User });
  let wishlist = null;
  if (user && user.length > 0) {
    wishlist = user[0].wishlist;
  }
  try {
    const minPrice = parseInt(req.query.minPrice) || 0;
    const maxPrice = parseInt(req.query.maxPrice) || 100000;
    const sortBy = req.query.sortBy || ''; 
    const page = parseInt(req.query.page) || 1; 
    const productsPerPage = 8; 
    const skip = (page - 1) * productsPerPage;

    let sortCriteria = {};
    if (sortBy === 'name_asc') {
      sortCriteria = { name: 1 }; 
    } else if (sortBy === 'name_desc') {
      sortCriteria = { name: -1 }; 
    } else if (sortBy === 'price_asc') {
      sortCriteria = { price: 1 }; 
    } else if (sortBy === 'price_desc') {
      sortCriteria = { price: -1 }; 
    }

    let products = await Products.find({
      category: "sports",
      price: { $gte: minPrice, $lte: maxPrice },
    }).sort(sortCriteria).skip(skip).limit(productsPerPage);
    const category = await Category.find({});
    const totalProducts = await Products.countDocuments({
      category: "sports",
      price: { $gte: minPrice, $lte: maxPrice },
    });
    const totalPages = Math.ceil(totalProducts / productsPerPage); 
    res.render("user/SportsShoeHome", {
      products,
      category,
      totalPages,
      currentPage: page,
      minPrice,
      maxPrice,
      sortBy,
      totalProducts,
      wishlist,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};




// const Sports = async (req, res) => {
//   const User = req.session.user;
//   const user = await collection.find({ email: User });
//   try {
//     const minPrice = req.query.minPrice || 0;
//     const maxPrice = req.query.maxPrice || 100000;
//     let products = await Products.find({
//       category: "sports",
//       price: { $gte: minPrice, $lte: maxPrice },
//     });

//     const { sortBy } = req.query;
//     if (sortBy === "name_asc") {
//       products.sort((a, b) => a.name.localeCompare(b.name));
//     } else if (sortBy === "name_desc") {
//       products.sort((a, b) => b.name.localeCompare(a.name));
//     } else if (sortBy === "price_asc") {
//       products.sort((a, b) => a.price - b.price);
//     } else if (sortBy === "price_desc") {
//       products.sort((a, b) => b.price - a.price);
//     }
//     const category = await Category.find({});
//     res.render("user/SportsShoeHome", { products, category,wishlist: user[0].wishlist});
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// };


const Sneakers = async (req, res) => {
  const User = req.session.user;
  const user = await collection.find({ email: User });
  let wishlist = null;
  if (user && user.length > 0) {
    wishlist = user[0].wishlist;
  }
  try {
    const minPrice = parseInt(req.query.minPrice) || 0;
    const maxPrice = parseInt(req.query.maxPrice) || 100000;
    const sortBy = req.query.sortBy || ''; 
    const page = parseInt(req.query.page) || 1; 
    const productsPerPage = 8; 
    const skip = (page - 1) * productsPerPage;

    let sortCriteria = {};
    if (sortBy === 'name_asc') {
      sortCriteria = { name: 1 }; 
    } else if (sortBy === 'name_desc') {
      sortCriteria = { name: -1 }; 
    } else if (sortBy === 'price_asc') {
      sortCriteria = { price: 1 }; 
    } else if (sortBy === 'price_desc') {
      sortCriteria = { price: -1 }; 
    }

    let products = await Products.find({
      category: "sneakers",
      price: { $gte: minPrice, $lte: maxPrice },
    }).sort(sortCriteria).skip(skip).limit(productsPerPage);
    const category = await Category.find({});
    const totalProducts = await Products.countDocuments({
      category: "sneakers",
      price: { $gte: minPrice, $lte: maxPrice },
    });
    const totalPages = Math.ceil(totalProducts / productsPerPage); 
    res.render("user/SneakersHome", {
      products,
      category,
      totalPages,
      currentPage: page,
      minPrice,
      maxPrice,
      sortBy,
      totalProducts,
      wishlist,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

let genotp = () => {
  return otpgenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
};

const mailsender = async (data) => {
  const generatedOTP = genotp();
  console.log(generatedOTP);
  console.log(data);
  const otpDocument = new otp({
    email: data.email,
    otp: generatedOTP,
  });
  // console.log(otpDocument);
  try {
    await otpDocument.save();

    // Send the email with the generated OTP
    transporter.sendMail(
      {
        from: process.env.EMAIL_ADDRESS,
        to: data.email,
        subject: "OTP Verification",
        text: "Verify Your Email Using the OTP",
        html: `<h3>Verify Your Email Using this OTP: ${generatedOTP}</h3>`,
      },
      (err, info) => {
        if (err) {
          console.log("Error sending email:", err);
        } else {
          console.log("Email sent successfully. Message ID:", info.messageId);
        }
      }
    );
  } catch (error) {
    console.error("Error saving OTP to the database:", error);
  }
};

const otpvalidation = async (req, res) => {
  try {
    console.log("hi");
    const latestOtp = await otp.findOne({}).sort({ _id: -1 }).limit(1);
    const otpValue = req.body.otp;
    console.log(otpValue);
    if (latestOtp.otp == otpValue) {
      console.log(req.session.data);
      const newUser = new collection({
        firstname: req.session.data.firstname,
        lastname: req.session.data.lastname,
        email: req.session.data.email,
        password: req.session.data.password,
      });
      await newUser.save();
      console.log("hi");
      res.json({ success: true, message: "OTP verification successful" });
    } else {
      res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const resendotp = (req, res) => {
  console.log("hello");
  mailsender(req.session.data);
  console.log("mm");
};

const profile = async (req, res) => {
  try {
    let user = await collection.findOne({ email: req.session.user });
    console.log(user);
    res.render("user/profile/profile", { user });
  } catch (error) {}
};

const profilePost = async (req, res) => {
  try {
    let user = await collection.findOne({ email: req.session.user });
    const { firstname, lastname } = req.body;
    user.firstname = firstname;
    user.lastname = lastname;

    // Save the updated user object
    await user.save();
    res.redirect("/profile");
  } catch (error) {}
};

const address = async (req, res) => {
  let address = await collection
    .findOne({ email: req.session.user })
    .select("address");
  res.locals.address = address?.address;
  res.render("user/profile/address");
};

const password = async (req, res) => {
  let message = false;
  res.render("user/profile/password", { message });
};

const passwordpost = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    let user = await collection.findOne({ email: req.session.user });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.password != currentPassword) {
      return res.render("user/profile/password", {
        message: "Current and Confirm password not matching",
      });
    }
    await collection.updateOne(
      { email: req.session.user },
      { $set: { password: newPassword } }
    );
    return res.render("user/profile/password", {
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const addresspost = async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      housename: req.body.housename,
      addresstype: req.body.addresstype,
      town: req.body.town,
      state: req.body.state,
      district: req.body.district,
      country: req.body.country,
      zipcode: req.body.zipcode,
    };

    req.params.data = data;
    // console.log("data", data);
    let user = await collection.findOne({ email: req.session.user });
    // console.log(user)
    // console.log(req.session.user);
    user.address.push(data);
    await user.save();
    res.redirect("/address");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addresspostadd = async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      housename: req.body.housename,
      addresstype: req.body.addresstype,
      town: req.body.town,
      state: req.body.state,
      district: req.body.district,
      country: req.body.country,
      zipcode: req.body.zipcode,
    };
    req.params.data = data;
    let user = await collection.findOne({ email: req.session.user });
    console.log(user);
    console.log(req.session.user);
    user.address.push(data);
    await user.save();
    const newid = user.address[user.address.length - 1]._id;
    res.status(200).json({ success: "added", newid: newid });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addressdelete = async (req, res) => {
  const address = req.params.id;

  try {
    const delAddress = await collection.findOneAndUpdate(
      { email: req.session.user },
      { $pull: { address: { _id: address } } },
      { new: true }
    );

    res.redirect("/address");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const description = async (req, res) => {
  try {
    const productId = req.params.id.toString();
    console.log("ID", productId);
    let issession = false
    if(req.session.user){
      issession = true
    }
    const product = await Products.findById(productId);
    const category = await Category.find({});
    if (!product) {
      return res.render("error", { message: "Product not found" });
    }
    // console.log(product);
    res.render("user/description", { product, category, issession });
  } catch (error) {
    console.log(error);
    res.render("error", { message: "An error occurred" });
  }
};




const cart = async (req, res) => {
  try {
    const UserEmail = req.session.user;
    const user = await collection
      .findOne({ email: UserEmail })
      .populate("cart.items.product");
      user.cart.TotalPrice += user.cart.discount;
      user.cart.discount = 0;
      user.cart.coupounId = null;
      await user.save();
    let cart = user.cart;

    res.render("user/add-to-cart", { cart });
  } catch (error) {
    res.json("not found");
  }
};

const addToCart = async (req, res) => {
  try {
    const productId = req.params.id.toString();
    const quantity = req.body.quantity || 1;
    const product = await Products.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const user = await collection.findOne({ email: req.session.user });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const existingProductIndex = user.cart.items.findIndex(
      (item) => item.product.toString() === productId
    );
    if (existingProductIndex !== -1) {
      if (
        product.stock <
        user.cart.items[existingProductIndex].quantity + quantity
      ) {
        return res
          .status(200)
          .json({
            success: false,
            error: "Requested quantity exceeds available stock",
          });
      }
      user.cart.items[existingProductIndex].quantity += quantity;
      user.cart.items[existingProductIndex].total =
        user.cart.items[existingProductIndex].quantity *
        user.cart.items[existingProductIndex].unitPrice;
    } else {
      user.cart.items.push({
        product: product._id,
        unitPrice: product.price,
        quantity: product.quantity,
        total: product.price * quantity,
      });
    }
    let totalPrice = 0;
    user.cart.items.forEach((item) => {
      totalPrice += item.total;
    });
    user.cart.TotalPrice = totalPrice;
    user.cart.grantTotal = user.cart.items.reduce(
      (acc, item) => acc + item.total,
      0
    );
    await user.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Product added to cart successfully",
        updatedProduct: user.cart.items[existingProductIndex],
        totalPrice: totalPrice,
      });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while adding product to cart",
      });
  }
};

const descriptionPost = async (req, res) => {
  try {
    const productId = req.params.id;
    const userEmail = req.session.user;
    const user = await collection.findOne({ email: userEmail });
    if (!user) {
      return res.json("User not found");
    }
    const product = await Products.findById(productId);
    if (!product) {
      return res.json("Product not found");
    }
    const cartItem = {
      product: productId,
      unitPrice: product.price,
      quantity: product.quantity,
      total: product.price,
    };

    user.cart.items.push(cartItem);
    await user.save();
    res.render("user/add-to-cart");
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res.status(500).json("Internal Server Error");
  }
};

const addressEdit = async (req, res) => {
  try {
    const addressEdit = req.params.id;
    //  console.log(addressEdit)
    const {
      name,
      housename,
      addresstype,
      town,
      state,
      district,
      country,
      zipcode,
    } = req.body;

    let data = await collection.findOneAndUpdate(
      { email: req.session.user, "address._id": addressEdit },
      { $set: { "address.$": req.body } },
      { new: true }
    );
    res.redirect("/address");
  } catch (error) {
    console.log(error, "errr");
  }
};

const getAddress = async (req, res) => {
  try {
    let data = await collection
      .findOne({ email: req.session.user })
      .select("address");
    let addressdata = data.address.filter((e) => e.id == req.params.id);
    res.json({ data: addressdata });
  } catch (error) {}
};

const logout = async (req, res) => {
  req.session.user = false;
  res.redirect("/login");
};

const removeProductFromCart = async (req, res) => {
  const productId = req.params.id; // Extract product ID from URL parameter

  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const updatedUser = await collection.findOneAndUpdate(
      { email: req.session.user },
      { $pull: { "cart.items": { _id: productId } } },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    let totalPrice = 0;
    updatedUser.cart.items.forEach((item) => {
      totalPrice += item.total;
    });

    // Update total price in the user's cart
    await collection.updateOne(
      { email: req.session.user },
      { $set: { "cart.TotalPrice": totalPrice } }
    );

    res
      .status(200)
      .json({
        success: true,
        message: "Product removed successfully",
        totalPrice,
      });
  } catch (error) {
    console.error("Error removing product from cart:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const checkout = async (req, res) => {
  try {
    const address = await collection.findOne({ email: req.session.user }).select("address");
    const user = await collection.findOne({ email: req.session.user }).populate("cart.items.product")
    // const User = await collection.findOne({}).select(' wallet.balance');
    // const walletbalance = User.wallet.balance;
      
    // ..........Apply Coupon........

    const coupons = await Coupon.find({});
    const validCoupons = [];

    coupons.forEach((coupon) => {
      if (coupon.couponValue) {
        validCoupons.push(coupon);
      }
    });
    res.render("user/checkout2", { address: address.address, user, coupons });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).send("Internal Server Error");
  }
};

const checkoutPost = async (req, res) => {
  try {
    const userData = req.session.user;
    const { shippingAddress, paymentMethod ,Paymentstatus } = req.body;
     const paymentstatus= Paymentstatus || 'confirmed';
    const user = await collection.findOne({ email: userData });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    for (const item of user.cart.items) {
      const product = await Products.findById(item.product._id);
      if (product) {
       if(product.stock<item.quantity){
        return res.json({nostock :'Stock Not Available'})
       }
      }
    }

    const ordershippingAddress = user.address.find(
      (addr) => addr._id == shippingAddress
    );
    if (!ordershippingAddress) {
      return res.status(404).json({ message: "Shipping address not found" });
    }

    const orderData = {
      user: userData,
      items: user.cart.items,
      shippingAddress: ordershippingAddress,
      paymentMethod: paymentMethod,
      TotalPrice: user.cart.TotalPrice,
      paymentstatus: paymentstatus,
    };

    const order = new Order(orderData);
    await order.save();

    // Decrease stock for each product in the order
    if(paymentstatus==='confirmed'){
       for (const item of user.cart.items) {
      const product = await Products.findById(item.product._id);
      if (product) {
        product.stock -= item.quantity; // Decrease the stock
        await product.save();
      }
    }
    }
   

    if(paymentMethod == 'wallet'){

      user.walletbalance -= user.cart.TotalPrice;
      user.wallethistory.push({
        process: 'Deducted Funds for purchase',
        amount: user.cart.TotalPrice,
        date: new Date()
    });
    }
    user.cart.items = [];
    user.cart.TotalPrice = 0;
    console.log("rrer", user.cart.items);
    user.cart.discount = 0;
    user.cart.coupounId = null;
    await user.save();
    console.log(user);
    // if(req.body.paymentMethod==="cod"){
    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createrazorpayorder = async (req, res) => {
  console.log("createrazor");
  try {
    const { amount } = req.body;
    console.log("Amount from request body:", amount);
    const options = {
      amount: Number(amount),
      currency: "INR",
      receipt: "order-receipt",
      payment_capture: 1,
    };
    console.log("Options for Razorpay order:", options);
    const razorpay = new Razorpay({
      key_id: "rzp_test_VdW2JzKd1CGF4j",
      key_secret: "PBQUGOZEvU7VlULZFd6byv4f",
    });

    razorpay.orders.create(options, (error, order) => {
      if (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ error: "Failed to create Razorpay order" });
      } else {
        console.log("Razorpay order created successfully:", order);
        return res.json({ orderId: order.id, amount: order.amount });
      }
    });
  } catch (error) {
    console.error("Caught error in createrazorpayorder:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const failedpay = async (req, res) => {
  const { orderId } = req.body;
  try {
      const order = await Order.findById(orderId);
      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }
      order.paymentstatus = 'confirmed';
      for (const item of order.items) {
        const product = await Products.findById(item.product._id);
        if (product) {
          product.stock -= item.quantity; // Decrease the stock
          await product.save();
        }
      }
      await order.save();
      return res.status(200).json({ message: 'Retrying Payment Successful' });
  } catch (error) {
      console.error('Error during finding the order:', error);
      res.status(500).send('Internal Server Error');
  }
};

const confirmOrder = async (req, res) => {
  try {
    res.render("user/orderConfirm");
  } catch (error) {}
};

const OrderPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;
    const totalOrders = await Order.countDocuments({ user: req.session.user });
    const totalPages = Math.ceil(totalOrders / limit);
    const orders = await Order.find({ user: req.session.user }).populate("items.product").sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.render("user/orderPage", { orders, totalPages, currentPage: page });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



 const viewOrderDetails = async (req, res) => {
  const orderId = req.params.orderId;
  const totalOrders = await Order.countDocuments({ user: req.session.user });
  const orders = await Order.find({_id: orderId}).populate("items.product");
  const orderDetails = { orderId: orderId,};
  res.render('user/orderDetails', { orderDetails: orderDetails,orders,totalOrders });
};





const cancelOrder = async (req, res) => {
  const User = req.session.user;
  try {
    // Find the user document
    const userdata = await collection.findOne({ email: User });

    if (!userdata) {
      return res.status(404).json({ error: "User not found" });
    }

    const { orderId, itemId } = req.body;
    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const item = order.items.find((item) => item._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found in the order" });
    }

    // Check if payment method is not COD
    if (order.paymentMethod !== 'COD') {
      const cancelledAmount = item.unitPrice * item.quantity;
      userdata.walletbalance += cancelledAmount;
      userdata.wallethistory.push({
        process: "Order cancellation refund",
        amount: cancelledAmount,
        date: new Date(),
      });
    }

    await userdata.save();
    item.status = "cancelled";
    await order.save();

    res.json({ message: "Order cancelled successfully", status: "cancelled" });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// ........................WishList   Starting..........................//

const wishlist = async (req, res) => {
  try {
    const User = req.session.user;
    console.log("hi Iam here");
    const user = await collection.findOne({ email: User });
    const category = await Category.find();
    const name = user.name;
    const data = user.wishlist;
    const cart = user.cart.items;
    const cartCount = cart.length;
    const productId = data.map((items) => items.product._id);
    const product = await Products.find({ _id: { $in: productId } });
    const price = product.price;

    res.render("user/wishlist", {
      cartCount,
      product,
      user,
      name,
      category,
      cart,
      price,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while fetching wishlist",
      });
  }
};

const wishlistPost = async (req, res) => {
  try {
    const productId = req.params.id;
    const User = req.session.user;
    const user = await collection.findOne({ email: User });
    const product = await Products.findById(productId);
    const productExist = user.wishlist.map(
      (items) => items.product._id.toString() === productId
    );

    if (productExist.includes(true)) {
      return res.json(" Product Already Exist");
    } else {
      let Wishlist = {
        product: product._id,
      };
      user.wishlist.push(Wishlist);
      await user.save();
      return res.json("Yes");
    }
  } catch (error) {
    console.error("Error adding product to wishlist:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while adding product to wishlist",
      });
  }
};


const wishDelete = async (req, res) => {
  try {
    const productId = req.params.id;
    const user = req.session.user;

    // Assuming your model is named "LogInModel"
    const result = await collection.findOneAndUpdate(
      { email: user },
      { $pull: { wishlist: { product: productId } } },
      { new: true } // To return the modified document
    );

    // Check if the product was successfully removed
    if (!result) {
      // Product not found in the wishlist
      return res.status(404).send("Product not found in the wishlist.");
    }

    res.redirect("/wishlist");
  } catch (error) {
    console.log("Wishlist deleting error: " + error);
    const message = error.message;
    res.render("404-error", { error, message });
  }
};

const wallet = async (req, res) => {
  const User = req.session.user;
  const user = await collection.findOne({ email: User });
  try {
    res.render("user/profile/wallet", { user });
  } catch (error) {}
};

const walletAdd = async(req,res)=>{
  const amountToAdd = parseInt(req.body.amount);
  const userEmail = req.session.user; 
  try {
    const user = await collection.findOne({ email: userEmail });
    user.walletbalance += amountToAdd;
    user.wallethistory.push({
        process: 'Added Funds',
        amount: amountToAdd,
        date: new Date()
    });

    await user.save();
    res.json({ message: " Amount added successfully"});
} catch (error) {
    console.error('Error adding funds to wallet:', error);
    res.status(500).send('Error adding funds to wallet. Please try again later.');
}
}

const coupon = async (req, res) => {
  // const User = "nandu@gmail.com";
  const User = req.session.user;
  const id = req.params.id;
  try {
    const user = await collection.findOne({ email: User });
    let cart = user.cart;
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    const coupon = await Coupon.findById(id);
    console.log("coupon", coupon);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    const couponAmount = (coupon.couponPercent / 100) * cart.TotalPrice;
    if (couponAmount > 0 && cart.TotalPrice > couponAmount) {
      const newTotalPrice = cart.TotalPrice - couponAmount;
      cart.TotalPrice = newTotalPrice;
      cart.discount = couponAmount;
      cart.coupounId = id;
      await user.save();
      console.log(user);
      return res.json({ message: "Coupon applied successfully", cart });
    } else {
      return res.status(400).json({ message: "Coupon cannot be applied" });
    }
  } catch (error) {}
};

const couponRemove = async (req, res) => {
  const userId = req.session.user;

  try {
    const user = await collection.findOne({ email: userId });
    if (!user) {
      return res.status(404).json({ message: "Cart not found" });
    }
    user.cart.TotalPrice += user.cart.discount;
    user.cart.discount = 0;
    user.cart.coupounId = null;
    await user.save();
    return res
      .status(200)
      .json({ message: "Coupon removed successfully", user });
  } catch (error) {
    console.error("Error removing coupon:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const orderreturn = async (req, res) => {
  const User = req.session.user;
  const { returnReason ,orderId, itemId  } = req.body;
  console.log(req.body);
  try {
    const userdata = await collection.findOne({ email: User });
    if (!userdata) {
    return res.status(404).json({ error: "User not found" });
    }
    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const item = order.items.find((item) => item._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found in the order" });
    }

    const cancelledAmount = item.unitPrice * item.quantity;
    userdata.walletbalance += cancelledAmount;
    userdata.wallethistory.push({
    process: "Order cancellation refund",
    amount: cancelledAmount,
    date: new Date(),
   });


    await userdata.save();
    item.returnReason = returnReason;
    item.status = 'returned'
    order.save();
    return res.status(200).json({ message: "return successfully" });
   }catch (error) {
    console.error("Error removing coupon:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
  };

// ........................WishList  Ending..........................//


const generateInvoice = async (req, res) => {
  const orderId = req.params.id;
  try {
      const order = await Order.findById(orderId).populate('items.product');
      if (!order) {
          return res.status(404).send('Order not found');
      }
      console.log(order);
      await createInvoice(order,res);   
  } catch (error) {
      console.error('Error generating or streaming PDF:', error);
      res.status(500).send('Internal Server Error');
  }
};

const footer1 =async(req,res)=>{
  try {
    res.render('user/footer1')
  } catch (error) { 
  }
}

const footer2 =async(req,res)=>{
  try {
    res.render('user/footer2')
  } catch (error) { 
  }
}


const footer3 =async(req,res)=>{
  try {
    res.render('user/footer3')
  } catch (error) {
    
  }
}
const footer4 =async(req,res)=>{
  try {
    res.render('user/footerLegal1')
  } catch (error) {
    
  }
}

const footer5 =async(req,res)=>{
  try {
    res.render('user/footerLegal2')
  } catch (error) {
    
  }
}

const cat= async(req,res)=>{
  const categoryName = req.params.name;
  const cate = await  Category.find({categoryName});
  if (category) {     
    res.render('user/LeatherHome', { cate });
    } else {  
    res.status(404).send('Category not found');
    }
}


module.exports = {
  signup,
  signuppost,
  profile,
  profilePost,
  address,
  addresspost,
  password,
  passwordpost,
  addressdelete,
  addressEdit,
  logout,
  loginget,
  loginpost,
  home,
  homePost,
  description,
  LeatherHome,
  addresspostadd,
  clogHome,
  mailsender,
  resendotp,
  otpvalidation,
  Sports,
  Sneakers,
  homebeforelogin,
  cart,
  getAddress,
  descriptionPost,
  addToCart,
  removeProductFromCart,
  forgetPassword,
  forgetPasswordPost,
  forgetPassOTP,
  forgetPassOTPpost,
  forgetPasswordPage,
  forgetPasswordPagePost,
  checkout,
  checkoutPost,
  createrazorpayorder,
  failedpay,
  confirmOrder,
  OrderPage,
  orderreturn,
  loginAuth,
  loginAuthRedirect,
  cancelOrder,
  wishlist,
  wishlistPost,
  wishDelete,
  wallet,
  walletAdd ,
  coupon,
  couponRemove,
  viewOrderDetails,
  generateInvoice,
  footer1,
  footer2,
  footer3,
  footer4,
  footer5,
  cat
};
