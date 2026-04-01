const mongoose = require('mongoose');
const User = require('../models/User');
const uri = process.env.MONGODB_URI;

const normalizeUserContactFields = async () => {
    await Promise.all([
        User.updateMany({ email: null }, { $unset: { email: 1 } }),
        User.updateMany({ email: '' }, { $unset: { email: 1 } }),
        User.updateMany({ phoneNumber: null }, { $unset: { phoneNumber: 1 } }),
        User.updateMany({ phoneNumber: '' }, { $unset: { phoneNumber: 1 } })
    ]);
};

const syncUserIndexes = async () => {
    await normalizeUserContactFields();
    await User.syncIndexes();
    console.log('User indexes synced');
};

const connectDB = async () => {
    try {
        await mongoose.connect(uri, {
            family: 4 // Force IPv4, prevents common Node.js DNS timeouts
        });
        console.log('MongoDB connected');
        await syncUserIndexes();

    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
