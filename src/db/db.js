const mongoose = require('mongoose');



async function connectDB() {

    try {
        
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/my_database');
        console.log("Database connected successfully ✅");

        
    } catch (error) {
        console.log("Failed to connect the Database ❌" , error);
        
    }
    
}



module.exports = connectDB;