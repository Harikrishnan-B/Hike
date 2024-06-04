const mongoose = require("mongoose");

const otpSchema= new mongoose.Schema({
   email:{
    type:String,
    required:true
   },
   otp:{
    type:String,
    required:true
   },
   createdAt:{
    type:Date,
    default:Date.now,
    expires:60
   }
   
});



otpSchema.index({createdAt:1},{expiresAfterSeconds:60})


module.exports=mongoose.model("OTP",otpSchema);