// src/services/mlService.js
const axios = require('axios');
const { formatPlayerDataForML } = require('../utils/helpers');

class MLService {
    constructor() {
        this.baseURL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5000';
        this.timeout = 10000;
        this.enabled = true;
        this.isHealthy = false;
    }

    /**
     * ML servisinin sağlık kontrolü
     */
    async checkHealth() {
        try {
            const response = await axios.get(`${this.baseURL}/health`, {
                timeout: 5000
            });
            this.isHealthy = response.data.models_loaded === true;
            console.log('✅ ML Service is healthy');
            return this.isHealthy;
        } catch (error) {
            console.warn('⚠️  ML Service is not available');
            console.error('Health check error:', error.message);
            this.isHealthy = false;
            return false;
        }
    }

    /**
     * Tek bir oyuncu için ML insights ekle
     */
    async addMLInsights(player, originalPlayer) {
        if (!this.enabled || !this.isHealthy) {
            return player;
        }

        try {
            // Python için tam veri formatı kullan (originalPlayer MongoDB'den gelen ham veri)
            const mlFormattedPlayer = formatPlayerDataForML(originalPlayer || player);

            console.log(`[ML] Sending data for ${mlFormattedPlayer.name}:`, {
                age: mlFormattedPlayer.age,
                market_value: mlFormattedPlayer.market_value,
                positions: mlFormattedPlayer.positions,
                has_stats: !!mlFormattedPlayer.stats,
                rating: mlFormattedPlayer.stats?.rating
            });

            const response = await axios.post(
                `${this.baseURL}/predict`,
                mlFormattedPlayer,
                {
                    timeout: this.timeout,
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            console.log(`[ML] Response for ${player.name}:`, {
                current: response.data.current_potential,
                future: response.data.future_potential,
                growth: response.data.potential_growth
            });

            // Client'a sadece formatlanmış player + mlInsights dön
            return {
                ...player,
                mlInsights: {
                    currentPotential: response.data.current_potential,
                    futurePotential: response.data.future_potential,
                    potentialGrowth: response.data.potential_growth,
                    developmentTrajectory: response.data.development_trajectory,
                    suitableRoles: response.data.suitable_roles || [],
                    confidenceScore: response.data.confidence_score
                }
            };
        } catch (error) {
            console.error(`[ML] Prediction failed for player ${player.name}:`, error.message);
            if (error.response?.data) {
                console.error('[ML] Error details:', error.response.data);
            }
            return player;
        }
    }

    /**
     * Birden fazla oyuncu için ML insights ekle (batch)
     * @param {Array} players - Formatted players (client format)
     * @param {Array} originalPlayers - Original players from MongoDB (with stats)
     */
    async enrichPlayers(players, originalPlayers = null) {
        if (!this.enabled || !players || players.length === 0) {
            return players;
        }

        // Health check yap
        const healthy = await this.checkHealth();
        if (!healthy) {
            console.warn('⚠️  ML Service not available, returning players without ML insights');
            return players;
        }

        try {
            // 50'şer 50'şer batch'le
            const batchSize = 50;
            const enrichedPlayers = [];

            for (let i = 0; i < players.length; i += batchSize) {
                const batch = players.slice(i, i + batchSize);
                const originalBatch = originalPlayers ? originalPlayers.slice(i, i + batchSize) : batch;

                try {
                    // Python için tam formatlı veriyi gönder
                    const mlFormattedBatch = originalBatch.map(player => formatPlayerDataForML(player));

                    console.log(`[ML] Batch ${i / batchSize + 1}: Sending ${mlFormattedBatch.length} players`);

                    const response = await axios.post(
                        `${this.baseURL}/predict_batch`,
                        { players: mlFormattedBatch },
                        {
                            timeout: 30000,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );

                    if (response.data && response.data.predictions) {
                        console.log(`[ML] Batch ${i / batchSize + 1}: Received ${response.data.predictions.length} predictions`);

                        batch.forEach((player, idx) => {
                            // Match by sofascore_id from originalBatch
                            const originalPlayer = originalBatch[idx];
                            const sofascoreId = originalPlayer?.sofascore_id ? String(originalPlayer.sofascore_id) : null;

                            const prediction = response.data.predictions.find(
                                p => (sofascoreId && String(p.sofascore_id) === sofascoreId) || p.name === player.name
                            );

                            enrichedPlayers.push({
                                ...player,
                                mlInsights: prediction ? {
                                    currentPotential: prediction.current_potential,
                                    futurePotential: prediction.future_potential,
                                    potentialGrowth: prediction.potential_growth,
                                    developmentTrajectory: prediction.development_trajectory || 'Unknown',
                                    suitableRoles: prediction.suitable_roles || [],
                                    confidenceScore: prediction.confidence_score || 0.75
                                } : null
                            });
                        });
                    } else {
                        // Response geçersizse orijinal batch'i ekle
                        console.warn(`[ML] Batch ${i / batchSize + 1}: Invalid response, skipping ML insights`);
                        enrichedPlayers.push(...batch);
                    }
                } catch (batchError) {
                    console.error(`[ML] Batch ${i / batchSize + 1} failed:`, batchError.message);
                    if (batchError.response?.data) {
                        console.error('[ML] Batch error details:', batchError.response.data);
                    }
                    // Hata olursa o batch'i olduğu gibi ekle
                    enrichedPlayers.push(...batch);
                }
            }

            // Future potential'e göre sırala (mlInsights olanlar önce)
            enrichedPlayers.sort((a, b) => {
                const potA = a.mlInsights?.futurePotential || 0;
                const potB = b.mlInsights?.futurePotential || 0;
                return potB - potA;
            });

            const successCount = enrichedPlayers.filter(p => p.mlInsights).length;
            console.log(`✓ ML insights added to ${successCount}/${enrichedPlayers.length} players`);
            return enrichedPlayers;

        } catch (error) {
            console.error('[ML] Batch enrichment failed:', error.message);
            return players;
        }
    }

    /**
     * ML servisini aktif/pasif yap
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`ML Service ${enabled ? 'enabled' : 'disabled'}`);
    }
}

module.exports = new MLService();
