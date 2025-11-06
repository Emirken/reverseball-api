const authService = require('../services/authService');

/**
 * Middleware to verify JWT token and authenticate user
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided. Please provide a valid token in Authorization header'
            });
        }

        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = authService.verifyToken(token);

        // Attach user info to request
        req.user = decoded;

        next();
    } catch (error) {
        if (error.message === 'Invalid or expired token') {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token. Please login again'
            });
        }

        return res.status(401).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};

/**
 * Middleware to check if user has specific scout type
 */
const requireScoutType = (...allowedTypes) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!allowedTypes.includes(req.user.scoutType)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. This route is only for ${allowedTypes.join(', ')} scouts`
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    requireScoutType
};
