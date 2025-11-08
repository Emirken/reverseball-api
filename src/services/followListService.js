const database = require('../config/database');
const { ObjectId } = require('mongodb');

class FollowListService {
  /**
   * Get all follow lists for a specific user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of follow lists
   */
  async getUserFollowLists(userId) {
    try {
      const db = database.getDb();
      const followLists = await db.collection('followLists')
        .find({ user_id: userId })
        .sort({ id: 1 })
        .toArray();

      return followLists;
    } catch (error) {
      console.error('Error fetching user follow lists:', error);
      throw error;
    }
  }

  /**
   * Get a specific follow list by ID
   * @param {number} listId - The follow list ID
   * @param {string} userId - The user ID (for authorization)
   * @returns {Promise<Object>} Follow list details
   */
  async getFollowListById(listId, userId) {
    try {
      const db = database.getDb();
      const followList = await db.collection('followLists')
        .findOne({
          id: parseInt(listId),
          user_id: userId
        });

      if (!followList) {
        throw new Error('Follow list not found or unauthorized');
      }

      return followList;
    } catch (error) {
      console.error('Error fetching follow list by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new follow list
   * @param {string} userId - The user ID
   * @param {string} name - Name of the follow list
   * @param {string} description - Description of the follow list
   * @returns {Promise<Object>} Created follow list
   */
  async createFollowList(userId, name, description) {
    try {
      const db = database.getDb();

      // Get the next sequential ID
      const lastFollowList = await db.collection('followLists')
        .find()
        .sort({ id: -1 })
        .limit(1)
        .toArray();

      const nextId = lastFollowList.length > 0 ? lastFollowList[0].id + 1 : 1;

      const newFollowList = {
        id: nextId,
        user_id: userId,
        name: name,
        description: description,
        players: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('followLists').insertOne(newFollowList);

      return {
        ...newFollowList,
        _id: result.insertedId
      };
    } catch (error) {
      console.error('Error creating follow list:', error);
      throw error;
    }
  }

  /**
   * Add a player to a follow list
   * @param {number} listId - The follow list ID
   * @param {string} playerName - Name of the player to add
   * @param {string} userId - The user ID (for authorization)
   * @returns {Promise<Object>} Updated follow list
   */
  async addPlayerToFollowList(listId, playerName, userId) {
    try {
      const db = database.getDb();

      // First, verify the follow list exists and belongs to the user
      const followList = await this.getFollowListById(listId, userId);

      // Check if player exists in the database
      const player = await db.collection('players')
        .findOne({ name: { $regex: new RegExp(`^${playerName}$`, 'i') } });

      if (!player) {
        throw new Error('Player not found');
      }

      // Check if player is already in the follow list
      const playerExists = followList.players.some(p => p.name === player.name);

      if (playerExists) {
        throw new Error('Player already exists in this follow list');
      }

      // Add player to the follow list
      const playerData = {
        name: player.name,
        club: player.club,
        league: player.league,
        nationality: player.nationality,
        positions: player.positions,
        age: player.age,
        sofascore_id: player.sofascore_id,
        fbref_id: player.fbref_id,
        image: player.image,
        addedAt: new Date()
      };

      const result = await db.collection('followLists').findOneAndUpdate(
        {
          id: parseInt(listId),
          user_id: userId
        },
        {
          $push: { players: playerData },
          $set: { updatedAt: new Date() }
        },
        { returnDocument: 'after' }
      );

      return result;
    } catch (error) {
      console.error('Error adding player to follow list:', error);
      throw error;
    }
  }

  /**
   * Remove a player from a follow list
   * @param {number} listId - The follow list ID
   * @param {string} playerName - Name of the player to remove
   * @param {string} userId - The user ID (for authorization)
   * @returns {Promise<Object>} Updated follow list
   */
  async removePlayerFromFollowList(listId, playerName, userId) {
    try {
      const db = database.getDb();

      const result = await db.collection('followLists').findOneAndUpdate(
        {
          id: parseInt(listId),
          user_id: userId
        },
        {
          $pull: { players: { name: playerName } },
          $set: { updatedAt: new Date() }
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error('Follow list not found or unauthorized');
      }

      return result;
    } catch (error) {
      console.error('Error removing player from follow list:', error);
      throw error;
    }
  }

  /**
   * Update follow list details (name and description)
   * @param {number} listId - The follow list ID
   * @param {string} userId - The user ID (for authorization)
   * @param {Object} updates - Object containing name and/or description
   * @returns {Promise<Object>} Updated follow list
   */
  async updateFollowList(listId, userId, updates) {
    try {
      const db = database.getDb();

      const updateFields = {};
      if (updates.name) updateFields.name = updates.name;
      if (updates.description !== undefined) updateFields.description = updates.description;
      updateFields.updatedAt = new Date();

      const result = await db.collection('followLists').findOneAndUpdate(
        {
          id: parseInt(listId),
          user_id: userId
        },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error('Follow list not found or unauthorized');
      }

      return result;
    } catch (error) {
      console.error('Error updating follow list:', error);
      throw error;
    }
  }

  /**
   * Delete a follow list
   * @param {number} listId - The follow list ID
   * @param {string} userId - The user ID (for authorization)
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFollowList(listId, userId) {
    try {
      const db = database.getDb();

      const result = await db.collection('followLists').deleteOne({
        id: parseInt(listId),
        user_id: userId
      });

      if (result.deletedCount === 0) {
        throw new Error('Follow list not found or unauthorized');
      }

      return { success: true, message: 'Follow list deleted successfully' };
    } catch (error) {
      console.error('Error deleting follow list:', error);
      throw error;
    }
  }
}

module.exports = new FollowListService();
