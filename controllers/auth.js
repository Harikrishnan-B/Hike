// const mongoose = require("mongoose");
// const user = require('../models/user');
// const passport = require('passport');
// const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;



// passport.use(new GoogleStrategy({
//     clientID:     process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "http://localhost:5000/auth/google/callback",
//     passReqToCallback   : true
//   },
//   function(request, accessToken, refreshToken, profile, done) {
//     user.findOrCreate({ googleId: user.id }, function (err, user) {
//       return done(err, user);
//     });
//   }
// ));

// passport.serializeUser((user,done)=>{
//   done(null,user)
// });

// passport.deserializeUser((user,done)=>{
//   done(null,user)
// })

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userModel = require("../models/user");
require('dotenv').config()


passport.serializeUser((user, done) => {
    done(null, user.id);//monogo id
})

passport.deserializeUser((id, done) => {
    userModel.findById(id).then((user) => {
        done(null, user)
    })
})

passport.use(
    new GoogleStrategy({
        callbackURL: "/auth/google/callback",

      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret:process.env.GOOGLE_CLIENT_SECRET
       
    }, (accessToken, refreshToken, profile, done) => {
      console.log(profile._json)
    
          userModel.findOne({email:profile._json.email}).then((currentUser) => {

            if(currentUser){
                console.log('user is'+ currentUser);
                done(null, currentUser)
            }else {
                new userModel({
                    firstname:profile._json.given_name,
                    lastname:profile._json.family_name,
                    email:profile._json.email,
                   
                }).save().then((newUser) => {
                    console.log('new user created'+newUser)
                    done(null, newUser)
                })
            }
        })

    })
)
