const mongoose =require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    catoffer: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    islisted:{
        type:Boolean,
        required:false
    },

});

module.exports= mongoose.model('Category',categorySchema);


