const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    product_images: {
        type: Array,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    offer: {
        type: Number,
        default: 0,
      },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    islisted: {
        type: Boolean,
        default: true,
    },
    rating:[{
        type: Number
    }],
    
});


module.exports = mongoose.model('Product', productSchema);
