 const mongoose = require('mongoose');


 const addressSchema = new mongoose.Schema({
     street: String,
     city: String,
     state: String,
     zipCode: String,
     country: String,
     phone: String,
     pincode: String,
     default: { type: Boolean, default: false }
 })

 const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        select:false
    },
    fullName:{
        firstName:{
            type:String,    
            require:true
        },
        lastName:{
            type:String,
            require:true
        },
      
    },
      role:{
            type:String,
            enum:["user","admin"],
            default:"user"
        },

        addresses:[
            addressSchema
        ]
 })


 const userModel = mongoose.model('user', userSchema);

 module.exports = userModel;