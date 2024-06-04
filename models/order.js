
const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    user: { type: String, ref: 'User', required: true },
    items: [
        {   
            _id: { type: String, required : true },
            product:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity:   { type: Number, default: 1 },
            unitPrice:  { type: Number, required: true },
            status:     { type: String, enum: ['pending', 'shipped', 'delivered','cancelled','returned'], default: 'pending' },
            returnReason:{type:String, required : false},
        }
    ],
    shippingAddress: {
        housename:   { type: String, required: true },
        addresstype: { type: String, required: false},
        town:        { type: String, required: true },
        state:       { type: String, required: true },
        district:    { type: String, required: true },
        country:     { type: String, required: true },
        zipcode:     { type: String, required: true },
    },
    paymentMethod: { type: String, required: true },
    paymentstatus: { type: String, enum : ['confirmed','failed'], default : 'confirmed' },
    TotalPrice:    { type: Number, required: true },
    createdAt: {
        type: Date,
        default: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    },
});

const Order = mongoose.model('Order', orderSchema);

module.exports=Order;


