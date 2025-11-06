const playerService = require('../services/playerService');
const searchService = require('../services/searchService');
const https = require('https');

class PlayersController {
    /**
     * GET /api/v1/reverseball/stPlayers - Get Strikers
     */
    async getStPlayers(req, res, next) {
        try {
            const players = await playerService.getStPlayers();
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/amPlayers - Get Attacking Midfielders
     */
    async getAmPlayers(req, res, next) {
        try {
            const players = await playerService.getAmPlayers();
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/lwPlayers - Get Left Wingers
     */
    async getLwPlayers(req, res, next) {
        try {
            const players = await playerService.getLwPlayers();
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/rwPlayers - Get Right Wingers
     */
    async getRwPlayers(req, res, next) {
        try {
            const players = await playerService.getRwPlayers();
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/dmPlayers - Get Defensive Midfielders
     */
    async getDmPlayers(req, res, next) {
        try {
            const { type } = req.query;
            const players = await playerService.getDmPlayers(type);
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/dmPlaymakerPlayers - Get Defensive Playmakers
     */
    async getDmPlaymakerPlayers(req, res, next) {
        try {
            const { type } = req.query;
            // You can implement specific logic here
            const players = await playerService.getDmPlaymakerPlayers(type);
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/mezellaPlayers - Get Mezella
     */
    async getMezellaPlayers(req, res, next) {
        try {
            const { type } = req.query;
            // You can implement specific logic here
            const players = await playerService.getMezellaPlayers(type);
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/mcPlayers - Get Central Midfielders
     */
    async getMcPlayers(req, res, next) {
        try {
            const { type } = req.query;
            // Implement specific logic for MC players
            const players = await playerService.getMcPlayers(); // Reuse or create specific method
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/boxToBoxPlayers - Get Box To Box Midfielders
     */
    async getBoxToBoxPlayers(req, res, next) {
        try {
            const { type } = req.query;
            // Implement specific logic for MC players
            const players = await playerService.getBoxToBoxPlayers(); // Reuse or create specific method
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/rightFullBackPlayers - Get Right FullBack
     */
    async getRightFullBackPlayers(req, res, next) {
        try {
            const { type } = req.query;
            // Implement specific logic for MC players
            const players = await playerService.getRightFullBackPlayers(); // Reuse or create specific method
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/lefttFullBackPlayers - Get Left FullBack
     */
    async getLeftFullBackPlayers(req, res, next) {
        try {
            const { type } = req.query;
            // Implement specific logic for MC players
            const players = await playerService.getLeftFullBackPlayers(); // Reuse or create specific method
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }


    /**
     * GET /api/v1/reverseball/rmPlayers - Get Right Midfielders
     */
    async getRmPlayers(req, res, next) {
        try {
            const players = await playerService.getRmPlayers();
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/lmPlayers - Get Left Midfielders
     */
    async getLmPlayers(req, res, next) {
        try {
            const players = await playerService.getLmPlayers();
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/rightDefendBackPlayers - Get Right Defend Backs
     */
    async getRightDefendPlayers(req, res, next) {
        try {
            const players = await playerService.getRightDefendPlayers();
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/rightDefendBackPlayers - Get Left Defend Backs
     */
    async getLeftDefendPlayers(req, res, next) {
        try {
            const players = await playerService.getLeftDefendPlayers();
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/dcPlayers - Get Center Backs
     */
    async getDcPlayers(req, res, next) {
        try {
            const players = await playerService.getDcPlayers();
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/gkPlayers - Get Goalkeepers
     */
    async getGkPlayers(req, res, next) {
        try {
            const players = await playerService.getGkPlayers();
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/playersDetail/:fbrefId - Get player details
     */
    async getPlayerDetail(req, res, next) {
        try {
            const { fbrefId } = req.params;

            if (!fbrefId) {
                return res.status(400).json({
                    success: false,
                    error: 'Player ID not specified'
                });
            }

            const player = await playerService.getPlayerDetail(fbrefId);

            if (!player) {
                return res.status(404).json({
                    success: false,
                    error: 'Player not found'
                });
            }

            res.json({
                success: true,
                data: player
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/search-player - Search players by name
     */
    async searchPlayersByName(req, res, next) {
        try {
            const { player, limit } = req.query;

            if (!player) {
                return res.status(400).json({
                    success: false,
                    error: 'Player name not specified'
                });
            }

            const players = await searchService.searchPlayersByName(
                player,
                parseInt(limit) || 20
            );

            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/formPlayers - Get all players for form analysis
     */
    async getFormPlayers(req, res, next) {
        try {
            const players = await playerService.getFormPlayers();
            res.json({
                success: true,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/search/advanced - Advanced search with filters
     */
    async advancedSearch(req, res, next) {
        try {
            const filters = {
                position: req.query.position,
                minAge: req.query.minAge ? parseInt(req.query.minAge) : undefined,
                maxAge: req.query.maxAge ? parseInt(req.query.maxAge) : undefined,
                minGoalsPer90: req.query.minGoalsPer90 ? parseFloat(req.query.minGoalsPer90) : undefined,
                minAssistsPer90: req.query.minAssistsPer90 ? parseFloat(req.query.minAssistsPer90) : undefined,
                minGoalsAssistsPer90: req.query.minGoalsAssistsPer90 ? parseFloat(req.query.minGoalsAssistsPer90) : undefined,
                minScaPer90: req.query.minScaPer90 ? parseFloat(req.query.minScaPer90) : undefined,
                minMatches: req.query.minMatches ? parseInt(req.query.minMatches) : undefined,
                nationality: req.query.nationality,
                league: req.query.league,
                club: req.query.club,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder
            };

            const limit = parseInt(req.query.limit) || 50;
            const players = await searchService.advancedSearch(filters, limit);

            res.json({
                success: true,
                count: players.length,
                filters: filters,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/search/by-metrics - Search by position and metrics
     */
    async searchByMetrics(req, res, next) {
        try {
            const { position } = req.query;

            if (!position) {
                return res.status(400).json({
                    success: false,
                    error: 'Position is required'
                });
            }

            const metrics = {
                minGoalsPer90: req.query.minGoalsPer90 ? parseFloat(req.query.minGoalsPer90) : undefined,
                minAssistsPer90: req.query.minAssistsPer90 ? parseFloat(req.query.minAssistsPer90) : undefined,
                minGoalsAssistsPer90: req.query.minGoalsAssistsPer90 ? parseFloat(req.query.minGoalsAssistsPer90) : undefined,
                minScaPer90: req.query.minScaPer90 ? parseFloat(req.query.minScaPer90) : undefined,
                minShotsPer90: req.query.minShotsPer90 ? parseFloat(req.query.minShotsPer90) : undefined,
                minMatches: req.query.minMatches ? parseInt(req.query.minMatches) : undefined,
                minMinutes: req.query.minMinutes ? parseInt(req.query.minMinutes) : undefined,
                minAge: req.query.minAge ? parseInt(req.query.minAge) : undefined,
                maxAge: req.query.maxAge ? parseInt(req.query.maxAge) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : 50
            };

            const players = await searchService.searchByPositionAndMetrics(position, metrics);

            res.json({
                success: true,
                position: position,
                metrics: metrics,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/top-performers - Get top performers by position
     */
    async getTopPerformers(req, res, next) {
        try {
            const { position, metric, limit } = req.query;

            if (!position) {
                return res.status(400).json({
                    success: false,
                    error: 'Position is required'
                });
            }

            const players = await searchService.getTopPerformers(
                position,
                metric || 'goals_per90',
                parseInt(limit) || 10
            );

            res.json({
                success: true,
                position: position,
                metric: metric || 'goals_per90',
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/similar-players/:fbrefId - Get similar players
     */
    async getSimilarPlayers(req, res, next) {
        try {
            const { fbrefId } = req.params;
            const { limit } = req.query;

            if (!fbrefId) {
                return res.status(400).json({
                    success: false,
                    error: 'Player ID is required'
                });
            }

            const players = await searchService.getSimilarPlayers(
                fbrefId,
                parseInt(limit) || 10
            );

            res.json({
                success: true,
                fbrefId: fbrefId,
                count: players.length,
                data: players
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/statistics/:position - Get statistics by position
     */
    async getStatisticsByPosition(req, res, next) {
        try {
            const { position } = req.params;

            if (!position) {
                return res.status(400).json({
                    success: false,
                    error: 'Position is required'
                });
            }

            const statistics = await searchService.getStatisticsByPosition(position);

            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reverseball/player-image/:playerId - Proxy player image from Sofascore
     */
    async getPlayerImage(req, res, next) {
        try {
            const { playerId } = req.params;

            if (!playerId) {
                return res.status(400).json({
                    success: false,
                    error: 'Player ID is required'
                });
            }

            const imageUrl = `https://api.sofascore.com/api/v1/player/${playerId}/image`;

            const options = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Referer': 'https://www.sofascore.com/',
                    'Origin': 'https://www.sofascore.com',
                    'Connection': 'keep-alive',
                    'Sec-Fetch-Dest': 'image',
                    'Sec-Fetch-Mode': 'no-cors',
                    'Sec-Fetch-Site': 'same-site',
                    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"'
                }
            };

            https.get(imageUrl, options, (proxyRes) => {
                // Log the response status for debugging
                console.log(`Image proxy response status: ${proxyRes.statusCode} for player ${playerId}`);

                if (proxyRes.statusCode !== 200) {
                    return res.status(proxyRes.statusCode).json({
                        success: false,
                        error: `Failed to fetch image: ${proxyRes.statusCode}`,
                        playerId: playerId
                    });
                }

                // Set cache headers
                res.set({
                    'Content-Type': proxyRes.headers['content-type'] || 'image/jpeg',
                    'Cache-Control': 'public, max-age=86400',
                    'Access-Control-Allow-Origin': '*'
                });

                proxyRes.pipe(res);
            }).on('error', (error) => {
                console.error('Error fetching image:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to fetch player image'
                });
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PlayersController();