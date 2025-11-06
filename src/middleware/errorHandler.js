/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // MongoDB errors
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        return res.status(500).json({
            success: false,
            error: 'Database error occurred',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Elasticsearch errors
    if (err.name === 'ResponseError') {
        return res.status(500).json({
            success: false,
            error: 'Search service error',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: err.message
        });
    }

    // CORS errors
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            error: 'CORS error',
            message: 'Origin not allowed'
        });
    }

    // Default error
    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

/**
 * 404 handler
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};