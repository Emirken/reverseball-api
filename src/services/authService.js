const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../config/database');

class AuthService {
    constructor() {
        this.usersCollection = null;
    }

    getUsersCollection() {
        if (!this.usersCollection) {
            this.usersCollection = database.getCollection('users');
        }
        return this.usersCollection;
    }

    /**
     * Register a new user
     */
    async register(userData) {
        try {
            const collection = this.getUsersCollection();

            // Check if user already exists
            const existingUser = await collection.findOne({ email: userData.email });
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            // Prepare user document
            const newUser = {
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                scoutType: userData.scoutType, // freelance, club, agency
                subscriptionType: userData.subscriptionType, // individual, team, enterprise
                billingPeriod: userData.billingPeriod, // monthly, yearly
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Add club-specific fields if scoutType is club
            if (userData.scoutType === 'club') {
                newUser.leagueCountry = userData.leagueCountry || null;
                newUser.clubName = userData.clubName || null;
            }

            // Insert user into database
            const result = await collection.insertOne(newUser);

            // Generate JWT token
            const token = this.generateToken({
                userId: result.insertedId,
                email: newUser.email,
                scoutType: newUser.scoutType
            });

            // Return user data without password
            const { password, ...userWithoutPassword } = newUser;
            return {
                user: {
                    ...userWithoutPassword,
                    _id: result.insertedId
                },
                token
            };
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    }

    /**
     * Login user
     */
    async login(email, password) {
        try {
            const collection = this.getUsersCollection();

            // Find user by email
            const user = await collection.findOne({ email });
            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Check password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new Error('Invalid email or password');
            }

            // Update last login
            await collection.updateOne(
                { _id: user._id },
                { $set: { lastLogin: new Date(), updatedAt: new Date() } }
            );

            // Generate JWT token
            const token = this.generateToken({
                userId: user._id,
                email: user.email,
                scoutType: user.scoutType
            });

            // Return user data without password
            const { password: _, ...userWithoutPassword } = user;
            return {
                user: userWithoutPassword,
                token
            };
        } catch (error) {
            console.error('Error logging in user:', error);
            throw error;
        }
    }

    /**
     * Generate JWT token
     */
    generateToken(payload) {
        const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

        return jwt.sign(payload, secret, { expiresIn });
    }

    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
            return jwt.verify(token, secret);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Get user by ID
     */
    async getUserById(userId) {
        try {
            const collection = this.getUsersCollection();
            const { ObjectId } = require('mongodb');

            const user = await collection.findOne(
                { _id: new ObjectId(userId) },
                { projection: { password: 0 } }
            );

            return user;
        } catch (error) {
            console.error('Error getting user by ID:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateUser(userId, updateData) {
        try {
            const collection = this.getUsersCollection();
            const { ObjectId } = require('mongodb');

            // Remove sensitive fields that shouldn't be updated this way
            const { password, email, _id, createdAt, ...allowedUpdates } = updateData;

            allowedUpdates.updatedAt = new Date();

            const result = await collection.findOneAndUpdate(
                { _id: new ObjectId(userId) },
                { $set: allowedUpdates },
                { returnDocument: 'after', projection: { password: 0 } }
            );

            return result;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }
}

module.exports = new AuthService();
