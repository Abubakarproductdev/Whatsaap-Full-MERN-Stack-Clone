const jwt = require('jsonwebtoken');

const generateWebToken = (userId) => {
    const normalizedUserId = String(userId);
    return jwt.sign(
        {
            id: normalizedUserId,
            userId: normalizedUserId
        },
        process.env.JWT_SECRET,
        { expiresIn: '1y' }
    );
};

module.exports =  generateWebToken ;
