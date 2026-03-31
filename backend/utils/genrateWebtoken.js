const jwt = require('jsonwebtoken');

const generateWebToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1y' });
};

module.exports =  generateWebToken ;