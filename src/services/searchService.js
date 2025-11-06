const esClient = require('../config/elasticsearch');
const database = require('../config/database');
const { createPlayerSearchQuery, createMetricFilterQuery, formatMarketValue } = require('../utils/helpers');

class SearchService {
    constructor() {
        this.client = esClient.getClient();
        this.index = process.env.ELASTICSEARCH_INDEX || 'players';
    }

    /**
     * Search players by name
     */
    async searchPlayersByName(playerName, limit = 20) {
        try {
            const query = createPlayerSearchQuery(playerName);

            const result = await this.client.search({
                index: this.index,
                body: {
                    query: query,
                    size: limit,
                    _source: [
                        'playerId',
                        'name',
                        'country',
                        'team',
                        'league',
                        'leagueCountry',
                        'positions',
                        'age',
                        'image',
                        'proposedMarketValue'
                    ]
                }
            });

            return result.hits.hits.map((hit, index) => ({
                id: index + 1,
                score: hit._score,
                ...hit._source
            }));
        } catch (error) {
            console.error('Error searching players by name:', error);
            throw error;
        }
    }

    /**
     * Advanced search with filters
     */
    async advancedSearch(filters, limit = 50) {
        try {
            const filterQuery = createMetricFilterQuery(filters);

            const result = await this.client.search({
                index: this.index,
                body: {
                    query: filterQuery,
                    size: limit,
                    sort: filters.sortBy ? [
                        { [filters.sortBy]: { order: filters.sortOrder || 'desc' } }
                    ] : undefined
                }
            });

            return result.hits.hits.map((hit, index) => ({
                id: index + 1,
                ...hit._source
            }));
        } catch (error) {
            console.error('Error in advanced search:', error);
            throw error;
        }
    }

    /**
     * Search by position with metrics
     */
    async searchByPositionAndMetrics(position, metrics = {}) {
        try {
            const must = [
                { match: { position: position } }
            ];

            // Add metric filters for stats_per90
            if (metrics.minGoalsPer90) {
                must.push({ range: { 'stats_per90.goals_per90': { gte: metrics.minGoalsPer90 } } });
            }
            if (metrics.minAssistsPer90) {
                must.push({ range: { 'stats_per90.assists_per90': { gte: metrics.minAssistsPer90 } } });
            }
            if (metrics.minGoalsAssistsPer90) {
                must.push({ range: { 'stats_per90.goals_assists_per90': { gte: metrics.minGoalsAssistsPer90 } } });
            }
            if (metrics.minScaPer90) {
                must.push({ range: { 'stats_per90.sca_per90': { gte: metrics.minScaPer90 } } });
            }
            if (metrics.minShotsPer90) {
                must.push({ range: { 'stats_per90.shots_total_per90': { gte: metrics.minShotsPer90 } } });
            }

            // Add filters for raw stats
            if (metrics.minMatches) {
                must.push({ range: { 'stats.matches_played': { gte: metrics.minMatches } } });
            }
            if (metrics.minMinutes) {
                must.push({ range: { 'stats.minutes': { gte: metrics.minMinutes } } });
            }
            if (metrics.minAge) {
                must.push({ range: { age: { gte: metrics.minAge } } });
            }
            if (metrics.maxAge) {
                must.push({ range: { age: { lte: metrics.maxAge } } });
            }

            const result = await this.client.search({
                index: this.index,
                body: {
                    query: {
                        bool: { must }
                    },
                    size: metrics.limit || 50,
                    sort: [
                        { 'stats_per90.goals_assists_per90': { order: 'desc' } }
                    ]
                }
            });

            return result.hits.hits.map((hit, index) => ({
                id: index + 1,
                ...hit._source
            }));
        } catch (error) {
            console.error('Error searching by position and metrics:', error);
            throw error;
        }
    }

    /**
     * Get top performers by position
     */
    async getTopPerformers(position, metricType = 'goals_per90', limit = 10) {
        try {
            const sortField = `stats_per90.${metricType}`;

            const result = await this.client.search({
                index: this.index,
                body: {
                    query: {
                        bool: {
                            must: [
                                { match: { position: position } },
                                { range: { [sortField]: { gt: 0 } } }
                            ]
                        }
                    },
                    size: limit,
                    sort: [
                        { [sortField]: { order: 'desc' } }
                    ]
                }
            });

            return result.hits.hits.map((hit, index) => ({
                rank: index + 1,
                ...hit._source,
                metric_value: hit._source.stats_per90?.[metricType] || 0
            }));
        } catch (error) {
            console.error('Error getting top performers:', error);
            throw error;
        }
    }

    /**
     * Aggregate statistics by position
     */
    async getStatisticsByPosition(position) {
        try {
            const result = await this.client.search({
                index: this.index,
                body: {
                    query: {
                        match: { position: position }
                    },
                    size: 0,
                    aggs: {
                        avg_goals_per90: { avg: { field: 'stats_per90.goals_per90' } },
                        avg_assists_per90: { avg: { field: 'stats_per90.assists_per90' } },
                        avg_goals_assists_per90: { avg: { field: 'stats_per90.goals_assists_per90' } },
                        avg_shots_per90: { avg: { field: 'stats_per90.shots_total_per90' } },
                        avg_sca_per90: { avg: { field: 'stats_per90.sca_per90' } },
                        avg_matches: { avg: { field: 'stats.matches_played' } },
                        avg_minutes: { avg: { field: 'stats.minutes' } },
                        total_players: { value_count: { field: 'fbref_id' } }
                    }
                }
            });

            return {
                position,
                statistics: {
                    averageGoalsPer90: result.aggregations.avg_goals_per90.value,
                    averageAssistsPer90: result.aggregations.avg_assists_per90.value,
                    averageGoalsAssistsPer90: result.aggregations.avg_goals_assists_per90.value,
                    averageShotsPer90: result.aggregations.avg_shots_per90.value,
                    averageScaPer90: result.aggregations.avg_sca_per90.value,
                    averageMatches: result.aggregations.avg_matches.value,
                    averageMinutes: result.aggregations.avg_minutes.value,
                    totalPlayers: result.aggregations.total_players.value
                }
            };
        } catch (error) {
            console.error('Error getting statistics by position:', error);
            throw error;
        }
    }

    /**
     * Multi-field search (name, team, league)
     */
    async multiFieldSearch(searchTerm, limit = 20) {
        try {
            const result = await this.client.search({
                index: this.index,
                body: {
                    query: {
                        multi_match: {
                            query: searchTerm,
                            fields: ['name^3', 'team^2', 'league', 'country'],
                            fuzziness: 'AUTO'
                        }
                    },
                    size: limit
                }
            });

            return result.hits.hits.map((hit, index) => ({
                id: index + 1,
                score: hit._score,
                ...hit._source
            }));
        } catch (error) {
            console.error('Error in multi-field search:', error);
            throw error;
        }
    }

    /**
     * General search - searches by player name or club name
     */
    async generalSearch(query, limit = 20) {
        try {
            const collection = database.getCollection();

            // Search in MongoDB for name or club matching the query
            const players = await collection.find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { club: { $regex: query, $options: 'i' } }
                ]
            }, {
                projection: { _id: 0, season: 0, sofascore_id: 0, scraped_at: 0 }
            })
            .limit(limit)
            .toArray();

            // Format market_value and positions for each player
            return players.map(player => {
                if (player.market_value !== undefined) {
                    player.market_value = formatMarketValue(player.market_value);
                }
                if (Array.isArray(player.positions)) {
                    player.positions = player.positions.join(',');
                }
                return player;
            });
        } catch (error) {
            console.error('Error in general search:', error);
            throw error;
        }
    }

    /**
     * Get similar players (based on statistics)
     */
    async getSimilarPlayers(fbrefId, limit = 10) {
        try {
            // First, get the player's data
            const playerDoc = await this.client.get({
                index: this.index,
                id: fbrefId
            });

            const player = playerDoc._source;
            const statsPer90 = player.stats_per90 || {};

            // Find similar players
            const result = await this.client.search({
                index: this.index,
                body: {
                    query: {
                        bool: {
                            must: [
                                { match: { position: player.position } }
                            ],
                            must_not: [
                                { term: { fbref_id: fbrefId } }
                            ],
                            should: [
                                {
                                    range: {
                                        'stats_per90.goals_per90': {
                                            gte: Math.max(0, (statsPer90.goals_per90 || 0) - 0.2),
                                            lte: (statsPer90.goals_per90 || 0) + 0.2
                                        }
                                    }
                                },
                                {
                                    range: {
                                        'stats_per90.assists_per90': {
                                            gte: Math.max(0, (statsPer90.assists_per90 || 0) - 0.15),
                                            lte: (statsPer90.assists_per90 || 0) + 0.15
                                        }
                                    }
                                },
                                {
                                    range: {
                                        'stats_per90.sca_per90': {
                                            gte: Math.max(0, (statsPer90.sca_per90 || 0) - 0.5),
                                            lte: (statsPer90.sca_per90 || 0) + 0.5
                                        }
                                    }
                                },
                                {
                                    range: {
                                        age: {
                                            gte: Math.max(16, player.age - 3),
                                            lte: player.age + 3
                                        }
                                    }
                                }
                            ],
                            minimum_should_match: 2
                        }
                    },
                    size: limit
                }
            });

            return result.hits.hits.map((hit, index) => ({
                id: index + 1,
                similarity_score: hit._score,
                ...hit._source
            }));
        } catch (error) {
            console.error('Error finding similar players:', error);
            throw error;
        }
    }
}

module.exports = new SearchService();