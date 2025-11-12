/**
 * Calculate age from timestamp
 * @param {number} timestamp - Birth timestamp
 * @returns {number} Age in years
 */
const calculateAge = (timestamp) => {
    if (!timestamp) return null;

    const birthDate = new Date(timestamp * 1000);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

/**
 * Sort players by performance ratio
 * @param {Array} players - Array of players
 * @returns {Array} Sorted players
 */
const sortPlayersByPerformance = (players, calculationType = 'goals') => {
    return players.sort((a, b) => {
        const aStats = a.statistics || {};
        const bStats = b.statistics || {};

        const aMinutesPlayed = Math.max(1, Math.ceil(aStats.minutesPlayed || 1));
        const bMinutesPlayed = Math.max(1, Math.ceil(bStats.minutesPlayed || 1));

        let aValue, bValue;

        if (calculationType === 'goals') {
            // For strikers
            aValue = (aStats.goals || 0) + (aStats.assists || 0) +
                ((aStats.expectedGoals || 0) || (aStats.goals || 0) / 1.5);
            bValue = (bStats.goals || 0) + (bStats.assists || 0) +
                ((bStats.expectedGoals || 0) || (bStats.goals || 0) / 1.5);
        } else if (calculationType === 'creative') {
            // For attacking midfielders
            aValue = Math.ceil((aStats.goals || 0) + (aStats.assists || 0) + (aStats.keyPasses || 0));
            bValue = Math.ceil((bStats.goals || 0) + (bStats.assists || 0) + (bStats.keyPasses || 0));
        }

        const aRatio = aValue / aMinutesPlayed;
        const bRatio = bValue / bMinutesPlayed;

        return bRatio - aRatio;
    });
};

/**
 * Add sequential IDs to players
 * @param {Array} players - Array of players
 * @returns {Array} Players with IDs
 */
const addSequentialIds = (players) => {
    return players.map((player, index) => ({
        ...player,
        id: index + 1
    }));
};

/**
 * Format market value to readable format
 * @param {number} marketValue - The market value in raw number format
 * @returns {string} Formatted market value (e.g., "4.1M €", "500K €")
 */
const formatMarketValue = (marketValue) => {
    if (!marketValue || marketValue === 0) {
        return '0 €';
    }

    if (marketValue >= 1000000) {
        // Convert to millions
        const millions = marketValue / 1000000;
        return `${millions.toFixed(1)}M €`;
    } else if (marketValue >= 1000) {
        // Convert to thousands
        const thousands = marketValue / 1000;
        return `${thousands.toFixed(0)}K €`;
    } else {
        return `${marketValue} €`;
    }
};

/**
 * Format player data - Returns only basic fields for client
 * @param {Object} player - Player object from MongoDB
 * @returns {Object} Formatted player
 */
const formatPlayerData = (player) => {
    return {
        name: player.name || null,
        age: player.age || null,
        club: player.club || null,
        footed: player.footed || null,
        height_cm: player.height_cm || null,
        market_value: formatMarketValue(player.market_value),  // Formatted for display
        market_value_raw: player.market_value || 0,  // Raw number for calculations
        image: player.image || null,
        league: player.league || null,
        league_country: player.league_country || null,
        nationality: player.nationality || null,
        positions: Array.isArray(player.positions) ? player.positions.join(',') : null,
    };
};

/**
 * Format player data for ML Service - Includes all fields needed by Python
 * @param {Object} player - Player object from MongoDB
 * @returns {Object} Formatted player with all ML-required fields
 */
const formatPlayerDataForML = (player) => {
    // Ensure positions is an array
    let positions = player.positions;
    if (typeof positions === 'string') {
        positions = positions.split(',').map(p => p.trim());
    } else if (!Array.isArray(positions)) {
        positions = [];
    }

    // Ensure age is a number
    const age = typeof player.age === 'number' ? player.age : parseInt(player.age) || 0;

    // Get raw market_value (number)
    // Try market_value_raw first (if coming from formatted), then market_value
    let marketValue = player.market_value_raw || player.market_value || 0;

    // If still a string (like "4.5M €"), parse it
    if (typeof marketValue === 'string') {
        // Remove all non-numeric except decimal point
        const cleaned = marketValue.replace(/[^0-9.]/g, '');
        marketValue = parseFloat(cleaned) || 0;

        // If it was in "M" format like "4.5M", multiply by 1 million
        if (marketValue > 0 && marketValue < 1000 && cleaned.includes('.')) {
            marketValue = marketValue * 1000000;
        }
    }

    return {
        name: player.name || null,
        age: age,  // NUMBER
        club: player.club || null,
        footed: player.footed || null,
        height_cm: player.height_cm || null,
        market_value: marketValue,  // CRITICAL: Python uses 'market_value' as NUMBER
        league: player.league || null,
        league_country: player.league_country || null,
        nationality: player.nationality || null,
        positions: positions,  // ARRAY
        sofascore_id: player.sofascore_id ? String(player.sofascore_id) : null,
        stats: player.stats || {}  // CRITICAL: Python needs stats for calculations
    };
};

/**
 * Create Elasticsearch query for player search
 * @param {string} searchTerm - Search term
 * @returns {Object} Elasticsearch query
 */
const createPlayerSearchQuery = (searchTerm) => {
    return {
        bool: {
            should: [
                {
                    match: {
                        name: {
                            query: searchTerm,
                            fuzziness: 'AUTO',
                            boost: 2
                        }
                    }
                },
                {
                    match_phrase_prefix: {
                        name: {
                            query: searchTerm,
                            boost: 3
                        }
                    }
                },
                {
                    wildcard: {
                        'name.keyword': {
                            value: `*${searchTerm}*`,
                            boost: 1
                        }
                    }
                }
            ],
            minimum_should_match: 1
        }
    };
};

/**
 * Create Elasticsearch filter query based on metrics
 * @param {Object} filters - Filter criteria
 * @returns {Object} Elasticsearch filter query
 */
const createMetricFilterQuery = (filters) => {
    const must = [];

    if (filters.position) {
        must.push({
            match: { position: filters.position }
        });
    }

    if (filters.minAge || filters.maxAge) {
        const ageRange = {};
        if (filters.minAge) ageRange.gte = filters.minAge;
        if (filters.maxAge) ageRange.lte = filters.maxAge;
        must.push({ range: { age: ageRange } });
    }

    if (filters.minGoalsPer90) {
        must.push({
            range: { 'stats_per90.goals_per90': { gte: filters.minGoalsPer90 } }
        });
    }

    if (filters.minAssistsPer90) {
        must.push({
            range: { 'stats_per90.assists_per90': { gte: filters.minAssistsPer90 } }
        });
    }

    if (filters.minGoalsAssistsPer90) {
        must.push({
            range: { 'stats_per90.goals_assists_per90': { gte: filters.minGoalsAssistsPer90 } }
        });
    }

    if (filters.minScaPer90) {
        must.push({
            range: { 'stats_per90.sca_per90': { gte: filters.minScaPer90 } }
        });
    }

    if (filters.minMatches) {
        must.push({
            range: { 'stats.matches_played': { gte: filters.minMatches } }
        });
    }

    if (filters.nationality) {
        must.push({
            match: { nationality: filters.nationality }
        });
    }

    if (filters.league) {
        must.push({
            match: { league: filters.league }
        });
    }

    if (filters.club) {
        must.push({
            match: { club: filters.club }
        });
    }

    return { bool: { must } };
};

module.exports = {
    calculateAge,
    sortPlayersByPerformance,
    addSequentialIds,
    formatPlayerData,
    formatPlayerDataForML,
    formatMarketValue,
    createPlayerSearchQuery,
    createMetricFilterQuery
};
