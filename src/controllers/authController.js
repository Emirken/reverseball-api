const authService = require('../services/authService');

class AuthController {
    /**
     * POST /api/v1/auth/register - Register new user
     */
    async register(req, res, next) {
        try {
            const {
                name,
                email,
                password,
                scoutType,
                subscriptionType,
                billingPeriod,
                leagueCountry,
                clubName
            } = req.body;

            // Validation
            if (!name || !email || !password || !scoutType || !subscriptionType || !billingPeriod) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide all required fields: name, email, password, scoutType, subscriptionType, billingPeriod'
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide a valid email address'
                });
            }

            // Validate password strength (minimum 6 characters)
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Password must be at least 6 characters long'
                });
            }

            // Validate scoutType
            const validScoutTypes = ['freelance', 'club', 'agency'];
            if (!validScoutTypes.includes(scoutType)) {
                return res.status(400).json({
                    success: false,
                    error: 'Scout type must be one of: freelance, club, agency'
                });
            }

            // Validate subscriptionType
            const validSubscriptionTypes = ['individual', 'team', 'enterprise'];
            if (!validSubscriptionTypes.includes(subscriptionType)) {
                return res.status(400).json({
                    success: false,
                    error: 'Subscription type must be one of: individual, team, enterprise'
                });
            }

            // Validate billingPeriod
            const validBillingPeriods = ['monthly', 'yearly'];
            if (!validBillingPeriods.includes(billingPeriod)) {
                return res.status(400).json({
                    success: false,
                    error: 'Billing period must be one of: monthly, yearly'
                });
            }

            const result = await authService.register({
                name,
                email,
                password,
                scoutType,
                subscriptionType,
                billingPeriod,
                leagueCountry,
                clubName
            });

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result
            });
        } catch (error) {
            if (error.message === 'User with this email already exists') {
                return res.status(409).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    }

    /**
     * POST /api/v1/auth/login - Login user
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            // Validation
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide email and password'
                });
            }

            const result = await authService.login(email, password);

            res.json({
                success: true,
                message: 'Login successful',
                data: result
            });
        } catch (error) {
            if (error.message === 'Invalid email or password') {
                return res.status(401).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    }

    /**
     * GET /api/v1/auth/me - Get current user profile
     */
    async getProfile(req, res, next) {
        try {
            // req.user is set by auth middleware
            const user = await authService.getUserById(req.user.userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/v1/auth/profile - Update user profile
     */
    async updateProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const updateData = req.body;

            const updatedUser = await authService.updateUser(userId, updateData);

            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedUser
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
