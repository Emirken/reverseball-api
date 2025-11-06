const { MongoClient } = require('mongodb');

class Database {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect() {
        try {
            const uri = process.env.MONGODB_URI;
            const dbName = process.env.MONGODB_DBNAME;

            this.client = new MongoClient(uri, {
                maxPoolSize: 50,
                minPoolSize: 10,
                maxIdleTimeMS: 30000,
                serverSelectionTimeoutMS: 5000,
            });

            await this.client.connect();
            this.db = this.client.db(dbName);

            console.log('✅ MongoDB connected successfully');
            console.log(`📦 Database: ${dbName}`);

            return this.db;
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            throw error;
        }
    }

    getDb() {
        if (!this.db) {
            throw new Error('Database not initialized. Call connect() first.');
        }
        return this.db;
    }

    getCollection(collectionName) {
        return this.getDb().collection(collectionName || process.env.MONGODB_COLLECTION);
    }

    async close() {
        if (this.client) {
            await this.client.close();
            console.log('MongoDB connection closed');
        }
    }
}

module.exports = new Database();