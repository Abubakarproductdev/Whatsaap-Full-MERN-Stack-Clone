
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(uri, {
            family: 4 // Force IPv4, prevents common Node.js DNS timeouts
        });
        console.log('MongoDB connected');

    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB;