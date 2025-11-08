const followListService = require('../services/followListService');

class FollowListController {
  /**
   * Get all follow lists for the authenticated user
   * GET /api/v1/followlist
   */
  async getUserFollowLists(req, res, next) {
    try {
      const userId = req.user.userId; // From auth middleware

      const followLists = await followListService.getUserFollowLists(userId);

      res.status(200).json({
        success: true,
        count: followLists.length,
        data: followLists
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific follow list by ID
   * GET /api/v1/followlist/:id
   */
  async getFollowListById(req, res, next) {
    try {
      const userId = req.user.userId;
      const listId = req.params.id;

      const followList = await followListService.getFollowListById(listId, userId);

      res.status(200).json({
        success: true,
        data: followList
      });
    } catch (error) {
      if (error.message === 'Follow list not found or unauthorized') {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * Create a new follow list
   * POST /api/v1/followlist
   * Body: { name, description }
   */
  async createFollowList(req, res, next) {
    try {
      const userId = req.user.userId;
      const { name, description } = req.body;

      // Validation
      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Name is required'
        });
      }

      const followList = await followListService.createFollowList(
        userId,
        name,
        description || ''
      );

      res.status(201).json({
        success: true,
        data: followList,
        message: 'Follow list created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a player to a follow list
   * POST /api/v1/followlist/:listId/player/:playerName
   */
  async addPlayerToFollowList(req, res, next) {
    try {
      const userId = req.user.userId;
      const { listId, playerName } = req.params;

      const decodedPlayerName = decodeURIComponent(playerName);

      const followList = await followListService.addPlayerToFollowList(
        listId,
        decodedPlayerName,
        userId
      );

      res.status(200).json({
        success: true,
        data: followList,
        message: 'Player added to follow list successfully'
      });
    } catch (error) {
      if (error.message === 'Player not found') {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error.message === 'Player already exists in this follow list') {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else if (error.message === 'Follow list not found or unauthorized') {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * Remove a player from a follow list
   * DELETE /api/v1/followlist/:listId/player/:playerName
   */
  async removePlayerFromFollowList(req, res, next) {
    try {
      const userId = req.user.userId;
      const { listId, playerName } = req.params;

      const decodedPlayerName = decodeURIComponent(playerName);

      const followList = await followListService.removePlayerFromFollowList(
        listId,
        decodedPlayerName,
        userId
      );

      res.status(200).json({
        success: true,
        data: followList,
        message: 'Player removed from follow list successfully'
      });
    } catch (error) {
      if (error.message === 'Follow list not found or unauthorized') {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * Update follow list details
   * PUT /api/v1/followlist/:id
   * Body: { name?, description? }
   */
  async updateFollowList(req, res, next) {
    try {
      const userId = req.user.userId;
      const listId = req.params.id;
      const { name, description } = req.body;

      if (!name && description === undefined) {
        return res.status(400).json({
          success: false,
          error: 'At least one field (name or description) is required'
        });
      }

      const followList = await followListService.updateFollowList(
        listId,
        userId,
        { name, description }
      );

      res.status(200).json({
        success: true,
        data: followList,
        message: 'Follow list updated successfully'
      });
    } catch (error) {
      if (error.message === 'Follow list not found or unauthorized') {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * Delete a follow list
   * DELETE /api/v1/followlist/:id
   */
  async deleteFollowList(req, res, next) {
    try {
      const userId = req.user.userId;
      const listId = req.params.id;

      const result = await followListService.deleteFollowList(listId, userId);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      if (error.message === 'Follow list not found or unauthorized') {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        next(error);
      }
    }
  }
}

module.exports = new FollowListController();
