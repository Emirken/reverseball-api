require('dotenv').config();
const app = require('./src/app');
const database = require('./src/config/database');
const esClient = require('./src/config/elasticsearch');
const mlService = require('./src/services/mlService');

const PORT = process.env.PORT || 3000;

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    try {
        // Close server
        if (server) {
            server.close(() => {
                console.log('✅ HTTP server closed');
            });
        }

        // Close database connections
        await database.close();

        console.log('✅ Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

// Server initialization
let server;

const startServer = async () => {
    try {
        // Connect to MongoDB
        console.log('🔄 Connecting to MongoDB...');
        await database.connect();

        // Initialize Elasticsearch
        console.log('🔄 Initializing Elasticsearch...');
        esClient.connect();

        // Optional: Check Elasticsearch connection
        try {
            await esClient.checkConnection();
            await esClient.createIndex();
        } catch (esError) {
            console.warn('\n⚠️  Elasticsearch is not available. Search features will be limited.');
            console.warn('💡 To enable search features, start Elasticsearch on http://localhost:9200');
            // Don't log the full error in development to reduce noise
            if (process.env.NODE_ENV === 'production') {
                console.warn('Error details:', esError.message);
            }
        }

        // Initialize ML Service
        console.log('🔄 Checking ML Service...');
        await mlService.checkHealth();

        // Start Express server
        server = app.listen(PORT, () => {
            console.log('\n' + '='.repeat(50));
            console.log('🚀 ReverseBall API Server Started');
            console.log('='.repeat(50));
            console.log(`📍 Port: ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Base URL: http://localhost:${PORT}`);
            console.log(`💚 Health Check: http://localhost:${PORT}/health`);
            console.log(`📊 API Base: http://localhost:${PORT}/api/v1/reverseball`);
            console.log('='.repeat(50) + '\n');
        });

        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use`);
            } else {
                console.error('❌ Server error:', error);
            }
            process.exit(1);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();