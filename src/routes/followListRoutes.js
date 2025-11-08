const express = require('express');
const router = express.Router();
const followListController = require('../controllers/followListController');
const { authenticate } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Get all follow lists for the authenticated user
router.get('/', followListController.getUserFollowLists);

// Create a new follow list
router.post('/', followListController.createFollowList);

// Get a specific follow list by ID
router.get('/:id', followListController.getFollowListById);

// Update a follow list
router.put('/:id', followListController.updateFollowList);

// Delete a follow list
router.delete('/:id', followListController.deleteFollowList);

// Add a player to a follow list
router.post('/:listId/player/:playerName', followListController.addPlayerToFollowList);

// Remove a player from a follow list
router.delete('/:listId/player/:playerName', followListController.removePlayerFromFollowList);

module.exports = router;
