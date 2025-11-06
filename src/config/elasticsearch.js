const { Client } = require('@elastic/elasticsearch');

class ElasticsearchClient {
    constructor() {
        this.client = null;
        this.index = process.env.ELASTICSEARCH_INDEX || 'players';
    }

    connect() {
        try {
            this.client = new Client({
                node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
                requestTimeout: 30000,
                maxRetries: 3
            });

            console.log('✅ Elasticsearch client initialized');
            return this.client;
        } catch (error) {
            console.error('❌ Elasticsearch connection error:', error);
            throw error;
        }
    }

    getClient() {
        if (!this.client) {
            this.connect();
        }
        return this.client;
    }

    async checkConnection() {
        try {
            const health = await this.client.cluster.health();
            console.log('📊 Elasticsearch cluster status:', health.status);
            return health;
        } catch (error) {
            console.error('❌ Elasticsearch health check failed:', error);
            throw error;
        }
    }

    async createIndex() {
        try {
            const exists = await this.client.indices.exists({ index: this.index });

            if (!exists) {
                await this.client.indices.create({
                    index: this.index,
                    body: {
                        settings: {
                            number_of_shards: 1,
                            number_of_replicas: 0,
                            analysis: {
                                analyzer: {
                                    player_name_analyzer: {
                                        type: 'custom',
                                        tokenizer: 'standard',
                                        filter: ['lowercase', 'asciifolding']
                                    }
                                }
                            }
                        },
                        mappings: {
                            properties: {
                                fbref_id: { type: 'keyword' },
                                name: {
                                    type: 'text',
                                    analyzer: 'player_name_analyzer',
                                    fields: {
                                        keyword: { type: 'keyword' }
                                    }
                                },
                                position: { type: 'keyword' },
                                age: { type: 'integer' },
                                nationality: { type: 'text' },
                                club: { type: 'text' },
                                league: { type: 'text' },
                                league_country: { type: 'text' },
                                footed: { type: 'keyword' },
                                height_cm: { type: 'integer' },
                                weight_kg: { type: 'integer' },
                                market_value: { type: 'text' },
                                season: { type: 'keyword' },
                                stats: {
                                    properties: {
                                        matches_played: { type: 'integer' },
                                        starts: { type: 'integer' },
                                        minutes: { type: 'integer' },
                                        goals: { type: 'integer' },
                                        assists: { type: 'integer' },
                                        shots_total: { type: 'integer' },
                                        shots_on_target: { type: 'integer' },
                                        xg: { type: 'float' },
                                        npxg: { type: 'float' },
                                        key_passes: { type: 'integer' },
                                        sca: { type: 'integer' },
                                        gca: { type: 'integer' }
                                    }
                                },
                                stats_per90: {
                                    properties: {
                                        goals_per90: { type: 'float' },
                                        assists_per90: { type: 'float' },
                                        goals_assists_per90: { type: 'float' },
                                        shots_total_per90: { type: 'float' },
                                        shots_on_target_per90: { type: 'float' },
                                        key_passes_per90: { type: 'float' },
                                        sca_per90: { type: 'float' },
                                        gca_per90: { type: 'float' },
                                        passes_completed_per90: { type: 'float' },
                                        progressive_passes_per90: { type: 'float' },
                                        tackles_per90: { type: 'float' },
                                        interceptions_per90: { type: 'float' }
                                    }
                                }
                            }
                        }
                    }
                });
                console.log(`✅ Index "${this.index}" created successfully`);
            } else {
                console.log(`ℹ️  Index "${this.index}" already exists`);
            }
        } catch (error) {
            console.error('❌ Error creating index:', error);
            throw error;
        }
    }

    async indexPlayer(player) {
        try {
            await this.client.index({
                index: this.index,
                id: player.playerId,
                document: player
            });
        } catch (error) {
            console.error('Error indexing player:', error);
            throw error;
        }
    }

    async bulkIndexPlayers(players) {
        try {
            const operations = players.flatMap(player => [
                { index: { _index: this.index, _id: player.playerId } },
                player
            ]);

            const result = await this.client.bulk({
                refresh: true,
                operations
            });

            console.log(`✅ Bulk indexed ${players.length} players`);
            return result;
        } catch (error) {
            console.error('Error bulk indexing players:', error);
            throw error;
        }
    }

    async searchPlayers(query) {
        try {
            const result = await this.client.search({
                index: this.index,
                ...query
            });
            return result;
        } catch (error) {
            console.error('Error searching players:', error);
            throw error;
        }
    }
}

module.exports = new ElasticsearchClient();