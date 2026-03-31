const express = require('express');
require('dotenv').config();
const connectDB = require('./config/dbconfig');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
const authRoutes = require('./routes/auth.routes');

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('WhatsApp Clone API is running...');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
