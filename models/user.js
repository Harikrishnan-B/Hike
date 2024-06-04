
const mongoose = require("mongoose");
const { wishlist } = require("../controllers/usercontroller");

const LogInSchema = new mongoose.Schema({
  firstname: { type: String },
  lastname: { type: String },
  email: { type: String },
  password: { type: String },
  isBlocked: { type: Boolean, default: false },
  address:[{
    name:{
      type:String,default:false
    },
    housename:{
      type:String,default:false
    },
    addresstype:{
      type:String,default:false
    },
    town:{
      type:String,default:false
    },
    state:{
      type:String,default:false
    },
    district:{
      type:String,default:false
    },
    country:{
      type:String,default:false
    },
    zipcode:{
      type:Number,default:false
    }
  }],

  cart :{
  items: [{
            product: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'Product', 
                
            },
            unitPrice: { 
                type: Number, 
                
            },
            quantity: { 
                type: Number, 
                default: 1 
            },
            total: { 
                type: Number
                
            },
          
        }],
        TotalPrice:{
          type:Number
          
        },
        discount :{
          type:Number,
          default : 0
        },
        coupounId:{ type: mongoose.Schema.Types.ObjectId, ref: 'coupon', required: false }
      },
      wishlist:
        [{
          product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        }],
        walletbalance: {
          type: Number,
          default: 0,
        },
        wallethistory: [
          {
            process: {
              type: String, 
            },
            amount: {
              type: Number,
            },
            date: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      
});

module.exports = mongoose.model("collectiontrylogs", LogInSchema, "collectiontrylogs");
