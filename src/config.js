const mongoose = require("mongoose");
const connect = mongoose.connect('mongodb://localhost:27017/Hike2');


//check database connection
connect.then(()=>{
    console.log("Database connected")
})
.catch(()=>{
    console.log("Database not connected")
});

//Create a Schema
const LoginSchema= new mongoose.Schema({
    name:{
        type:String,
        require:true

    },
    password:{
        type:String,
        required:true
    }
});

const collection=new mongoose.model("users",LoginSchema);

module.exports=collection;