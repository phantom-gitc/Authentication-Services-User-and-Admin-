const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const redis = require('../db/redis');

async function authMiddleware(req, res, next) {

    let token = req.cookies?.token; 

   // If token is not in cookies, check Authorization header
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    } 

    // Check if token is blacklisted (only if Redis is connected)
    try {
        if (redis.connected) {
            const isBlacklisted = await redis.get(`blacklist_${token}`);
            if (isBlacklisted) {
                return res.status(401).json({ message: 'Unauthorized - Token has been revoked' });
            }
        }
    } catch (err) {
        // Log redis error but don't block authentication
        console.warn('Redis blacklist check failed:', err.message);
    }

    // Verify token and attach user info to request 
    try {

        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();

    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

module.exports = {
    authMiddleware,
};
