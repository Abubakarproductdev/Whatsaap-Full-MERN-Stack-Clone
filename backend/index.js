const express = require('express');
require('dotenv').config();
const connectDB = require('./config/dbconfig');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());


// Connect to MongoDB
connectDB();

// Routes
const authRoutes = require('./routes/auth.routes');

app.use('/api/auth', authRoutes);


// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
