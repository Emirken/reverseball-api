const database = require('../config/database');
const mlService = require('./mlService');
const {
    calculateAge,
    sortPlayersByPerformance,
    addSequentialIds,
    formatPlayerData,
    formatMarketValue
} = require('../utils/helpers');

class PlayerService {
    constructor() {
        this.collection = null;
    }

    getCollection() {
        if (!this.collection) {
            this.collection = database.getCollection();
        }
        return this.collection;
    }

    /**
     * Calculate per 90 minute statistic
     * @param {number} statValue - The total statistic value
     * @param {number} minutesPlayed - Total minutes played from stats field
     * @returns {number} - The statistic per 90 minutes
     */
    per90(statValue, minutesPlayed) {
        if (!minutesPlayed || minutesPlayed === 0) {
            return 0;
        }
        return (statValue * 90) / minutesPlayed;
    }

    /**
     * Get Strikers (Centre-Forward)
     */
    async getStPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: "ST"
        });

        const players = [];
        const originalPlayers = [];
        for await (const player of cursor) {
            const stats = player.stats || {};

            // Required metrics from stats_per90
            const appearances = stats.appearances || 0;
            const goalsAssistsSum = stats.goalsAssistsSum || 0;
            const expectedGoals = stats.expectedGoals || 0;
            const totalShots = stats.totalShots || 0;
            const goalConversionPercentage = stats.goalConversionPercentage || 0;

            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances;

            // Sum of the three metrics
            const totalMetricValue = (this.per90(goalsAssistsSum,minutesPlayed) * 3) + (this.per90(expectedGoals,minutesPlayed) * 2)
                + this.per90(totalShots,minutesPlayed);

            if (
                appearances >=3 &&
                goalConversionPercentage >=18.4&&
                totalMetricValue >= 5 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player); // MongoDB'den gelen orijinal veri
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);
    }

    /**
     * Get Attacking Midfielders (AM)
     */
    async getAmPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: { $in: ['AM'] }
        });

        const players = [];
        const originalPlayers = [];
        for await (const player of cursor) {
            const stats = player.stats || {};

            // Required metrics from stats_per90
            const appearances = stats.appearances || 0;
            const assists = stats.assists || 0;
            const expectedAssists = stats.expectedAssists || 0;
            const bigChancesCreated = stats.bigChancesCreated || 0;
            const keyPasses = stats.keyPasses || 0;
            const accurateFinalThirdPasses = stats.accurateFinalThirdPasses || 0;

            // Calculate minutes per match
            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances || 0;

            // Sum of the three metrics
            const totalMetricValue = this.per90(assists,minutesPlayed) +this.per90(expectedAssists,minutesPlayed)
                + this.per90(bigChancesCreated,minutesPlayed)+ this.per90(keyPasses,minutesPlayed);

            if (
                appearances >= 3 &&
                totalMetricValue >= 1.5 &&
                this.per90(accurateFinalThirdPasses,minutesPlayed) >= 8 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player);
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);
    }

    /**
     * Get Left Wingers (LW)
     */
    async getLwPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: { $in: ['LW', 'ML'] }
        });

        const players = [];
        const originalPlayers = [];
        for await (const player of cursor) {
            const stats = player.stats || {};

            // Calculate minutes per match
            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances || 0;

            // Required metrics from stats_per90
            const goalsAssistsSum = this.per90(stats.goalsAssistsSum,minutesPlayed)  || 0;
            const keyPasses =this.per90(stats.keyPasses,minutesPlayed)  || 0;
            const expectedAssists =this.per90(stats.expectedAssists,minutesPlayed)  || 0;
            const passToAssist =this.per90(stats.passToAssist,minutesPlayed)  || 0;




            // Sum of the three metrics
            const totalMetricValue = goalsAssistsSum + keyPasses + expectedAssists + passToAssist;

            if (
                stats.appearances >=3 &&
                totalMetricValue >= 2 &&
                keyPasses >= 0.7 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player);
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);

    }

    /**
     * Get Right Wingers (RW)
     */
    async getRwPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: { $in: ['RW', 'MR'] }
        });

        const players = [];
        const originalPlayers = [];
        for await (const player of cursor) {
            const stats = player.stats || {};

            // Calculate minutes per match
            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances || 0;

            // Required metrics from stats_per90
            const goalsAssistsSum = this.per90(stats.goalsAssistsSum,minutesPlayed)  || 0;
            const keyPasses =this.per90(stats.keyPasses,minutesPlayed)  || 0;
            const expectedAssists =this.per90(stats.expectedAssists,minutesPlayed)  || 0;
            const passToAssist =this.per90(stats.passToAssist,minutesPlayed)  || 0;




            // Sum of the three metrics
            const totalMetricValue = goalsAssistsSum + keyPasses + expectedAssists + passToAssist;

            if (
                stats.appearances >=3 &&
                totalMetricValue >= 2 &&
                keyPasses >= 0.7 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player);
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);
    }

    /**
     * Get Right Midfielders (RM)
     */
    async getRmPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: { $in: ['MR', 'DR'] }
        });

        const players = [];
        const originalPlayers = [];
        for await (const player of cursor) {
            const stats = player.stats || {};

            // Calculate minutes per match
            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances || 0;

            // Required metrics from stats_per90
            const assists =this.per90(stats.assists,minutesPlayed)  || 0;
            const totalCross =this.per90(stats.totalCross,minutesPlayed)  || 0;
            const tackles =this.per90(stats.tackles,minutesPlayed)  || 0;
            const keyPasses =this.per90(stats.keyPasses,minutesPlayed)  || 0;

            const accurateFinalThirdPasses =this.per90(stats.accurateFinalThirdPasses,minutesPlayed)  || 0;


            // Sum of the three metrics
            const totalMetricValue = assists + totalCross + tackles + keyPasses;

            if (
                stats.appearances >=3 &&
                accurateFinalThirdPasses >= 6 &&
                totalCross >= 2 &&
                tackles >= 0.9 &&
                totalMetricValue >= 5 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player);
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);
    }

    /**
     * Get Left Midfielders (LM)
     */
    async getLmPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: { $in: ['ML', 'DL'] }
        });

        const players = [];
        const originalPlayers = [];
        for await (const player of cursor) {
            const stats = player.stats || {};

            // Calculate minutes per match
            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances || 0;

            // Required metrics from stats_per90
            const assists =this.per90(stats.assists,minutesPlayed)  || 0;
            const totalCross =this.per90(stats.totalCross,minutesPlayed)  || 0;
            const tackles =this.per90(stats.tackles,minutesPlayed)  || 0;
            const keyPasses =this.per90(stats.keyPasses,minutesPlayed)  || 0;

            const accurateFinalThirdPasses =this.per90(stats.accurateFinalThirdPasses,minutesPlayed)  || 0;


            // Sum of the three metrics
            const totalMetricValue = assists + totalCross + tackles + keyPasses;

            if (
                stats.appearances >=3 &&
                accurateFinalThirdPasses >= 6 &&
                totalCross >= 2 &&
                tackles >= 0.9 &&
                totalMetricValue >= 5 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player);
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);
    }

    /**
     * Get Defensive Midfield (DM)
     */
    async getDmPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: { $in: ['DM'] }
        });

        const players = [];
        const originalPlayers = [];
        for await (const player of cursor) {
            const stats = player.stats || {};

            // Calculate minutes per match
            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances || 0;

            // Required metrics from stats_per90
            const ballRecovery =this.per90(stats.ballRecovery,minutesPlayed)  || 0;
            const tackles =this.per90(stats.tackles,minutesPlayed)  || 0;
            const interceptions =this.per90(stats.interceptions,minutesPlayed)  || 0;

            const totalDuelsWonPercentage =stats.totalDuelsWonPercentage || 0;


            // Sum of the three metrics
            const totalMetricValue = ballRecovery + tackles + interceptions;

            if (
                stats.appearances >=3 &&
                totalDuelsWonPercentage >= 40  &&
                ballRecovery >= 4.5 &&
                totalMetricValue >= 7.5 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player);
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);
    }

    /**
     * Get Deep*Lying Midfield (DM)
     */
    async getDmPlaymakerPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: { $in: ['DM','MC'] }
        });

        const players = [];
         const originalPlayers = [];
        for await (const player of cursor) {
            const stats = player.stats || {};

            // Calculate minutes per match
            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances || 0;

            // Required metrics from stats_per90
            const keyPasses =this.per90(stats.keyPasses,minutesPlayed)  || 0;
            const accurateFinalThirdPasses =this.per90(stats.accurateFinalThirdPasses,minutesPlayed)  || 0;
            const interceptions =this.per90(stats.interceptions,minutesPlayed)  || 0;

            const accurateLongBalls =stats.accurateLongBalls || 0;


            // Sum of the three metrics
            const totalMetricValue = keyPasses + accurateFinalThirdPasses + interceptions;

            if (
                stats.appearances >=3 &&
                accurateLongBalls >= 3 &&
                totalMetricValue >= 13 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player);
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);
    }

    /**
     * Get Mezella Midfield (Mezella)
     */
    async getMezellaPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: { $in: ['MC'] }
        });

        const players = [];
        const originalPlayers = [];
        for await (const player of cursor) {
            const stats = player.stats || {};

            // Calculate minutes per match
            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances || 0;

            // Required metrics from stats_per90
            const keyPasses =this.per90(stats.keyPasses,minutesPlayed)  || 0;
            const bigChancesCreated =this.per90(stats.bigChancesCreated,minutesPlayed)  || 0;
            const goalsAssistsSum =this.per90(stats.goalsAssistsSum,minutesPlayed)  || 0;
            const possessionWonAttThird =this.per90(stats.possessionWonAttThird,minutesPlayed)  || 0;

            const successfulDribblesPercentage =stats.successfulDribblesPercentage || 0;
            const accurateFinalThirdPasses =this.per90(stats.accurateFinalThirdPasses,minutesPlayed)  || 0;

            // Sum of the three metrics
            const totalMetricValue = bigChancesCreated + goalsAssistsSum + keyPasses + possessionWonAttThird;

            if (
                stats.appearances >=3 &&
                successfulDribblesPercentage >= 50 &&
                accurateFinalThirdPasses >= 7 &&
                totalMetricValue >= 3 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player);
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);
    }

    /**
     * Get Central Midfield (CM)
     */
    async getMcPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: { $in: ['MC'] }
        });

        const players = [];
        const originalPlayers = [];
        for await (const player of cursor) {
            const stats = player.stats || {};

            // Calculate minutes per match
            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances || 0;

            // Required metrics from stats_per90
            const keyPasses =this.per90(stats.keyPasses,minutesPlayed)  || 0;
            const accurateFinalThirdPasses =this.per90(stats.accurateFinalThirdPasses,minutesPlayed)  || 0;
            const tackles =this.per90(stats.tackles,minutesPlayed)  || 0;
            const ballRecovery =this.per90(stats.ballRecovery,minutesPlayed)  || 0;

            const accuratePassesPercentage =stats.accuratePassesPercentage || 0;

            // Sum of the three metrics
            const totalMetricValue = accurateFinalThirdPasses + tackles + keyPasses + ballRecovery;

            if (
                stats.appearances >=3 &&
                accuratePassesPercentage >= 84.5 &&
                totalMetricValue >= 17 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player);
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);
    }

    /**
     * Get Box to Box Midfield (BoxToBox)
     */
    async getBoxToBoxPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: { $in: ['DM','MC'] }
        });

        const players = [];
        const originalPlayers = [];
        for await (const player of cursor) {
            const stats = player.stats || {};

            // Calculate minutes per match
            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances || 0;

            // Required metrics from stats_per90
            const keyPasses =this.per90(stats.keyPasses,minutesPlayed)  || 0;
            const possessionWonAttThird  =this.per90(stats.possessionWonAttThird ,minutesPlayed)  || 0;
            const tackles =this.per90(stats.tackles,minutesPlayed)  || 0;
            const ballRecovery =this.per90(stats.ballRecovery,minutesPlayed)  || 0;
            const successfulDribbles =this.per90(stats.successfulDribbles,minutesPlayed)  || 0;

            const totalDuelsWonPercentage =stats.totalDuelsWonPercentage || 0;

            // Sum of the three metrics
            const totalMetricValue = possessionWonAttThird + tackles + keyPasses + ballRecovery + successfulDribbles;

            if (
                stats.appearances >=3 &&
                possessionWonAttThird >= 0.25 &&
                successfulDribbles >= 0.15 &&
                keyPasses >= 0.5 &&
                tackles >= 1 &&
                ballRecovery >= 3.0 &&
                totalDuelsWonPercentage >= 45 &&
                totalMetricValue >= 6.5 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player);
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);
    }

    /**
     * Get Right Full Back (RB)
     */
    async getRightFullBackPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: { $in: ['DR'] }
        });

        const players = [];
        const originalPlayers = [];

        for await (const player of cursor) {
            const stats = player.stats || {};

            // Calculate minutes per match
            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances || 0;

            // Required metrics from stats_per90
            const keyPasses =this.per90(stats.keyPasses,minutesPlayed)  || 0;
            const totalCross  =this.per90(stats.totalCross ,minutesPlayed)  || 0;
            const accurateFinalThirdPasses =this.per90(stats.accurateFinalThirdPasses,minutesPlayed)  || 0;
            const assists =this.per90(stats.assists,minutesPlayed)  || 0;
            const tackles =this.per90(stats.tackles,minutesPlayed)  || 0;


            // Sum of the three metrics
            const totalMetricValue = totalCross + tackles + keyPasses + accurateFinalThirdPasses + assists;

            if (
                stats.appearances >=3 &&
                totalCross >= 2 &&
                totalMetricValue >= 13 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player);
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);
    }

    /**
     * Get Left Full Back (RB)
     */
    async getLeftFullBackPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: { $in: ['DL'] }
        });

        const players = [];
        const originalPlayers = [];
        for await (const player of cursor) {
            const stats = player.stats || {};

            // Calculate minutes per match
            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances || 0;

            // Required metrics from stats_per90
            const keyPasses =this.per90(stats.keyPasses,minutesPlayed)  || 0;
            const totalCross  =this.per90(stats.totalCross ,minutesPlayed)  || 0;
            const accurateFinalThirdPasses =this.per90(stats.accurateFinalThirdPasses,minutesPlayed)  || 0;
            const assists =this.per90(stats.assists,minutesPlayed)  || 0;
            const tackles =this.per90(stats.tackles,minutesPlayed)  || 0;


            // Sum of the three metrics
            const totalMetricValue = totalCross + tackles + keyPasses + accurateFinalThirdPasses + assists;

            if (
                stats.appearances >=3 &&
                totalCross >= 2 &&
                totalMetricValue >= 13 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player);
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);
    }

    /**
     * Get Right Defend Backs (DC)
     */
    async getRightDefendPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: { $in: ['DR'] }
        });

        const players = [];
        const originalPlayers = [];
        for await (const player of cursor) {
            const stats = player.stats || {};

            // Calculate minutes per match
            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances || 0;

            // Required metrics from stats_per90
            const ballRecovery =this.per90(stats.ballRecovery,minutesPlayed)  || 0;
            const tackles =this.per90(stats.tackles,minutesPlayed)  || 0;
            const interceptions =this.per90(stats.interceptions,minutesPlayed)  || 0;
            const clearances =this.per90(stats.clearances,minutesPlayed)  || 0;

            const totalDuelsWonPercentage =stats.totalDuelsWonPercentage || 0;


            // Sum of the three metrics
            const totalMetricValue = ballRecovery + tackles + interceptions + clearances;

            if (
                stats.appearances >=3 &&
                totalDuelsWonPercentage >= 48  &&
                ballRecovery >= 3.5  &&
                totalMetricValue >= 9 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player);
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);
    }
    /**
     * Get Left Defend Backs (DC)
     */
    async getLeftDefendPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: { $in: ['DL'] }
        });

        const players = [];
        const originalPlayers = [];
        for await (const player of cursor) {
            const stats = player.stats || {};

            // Calculate minutes per match
            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances || 0;

            // Required metrics from stats_per90
            const ballRecovery =this.per90(stats.ballRecovery,minutesPlayed)  || 0;
            const tackles =this.per90(stats.tackles,minutesPlayed)  || 0;
            const interceptions =this.per90(stats.interceptions,minutesPlayed)  || 0;
            const clearances =this.per90(stats.clearances,minutesPlayed)  || 0;

            const totalDuelsWonPercentage =stats.totalDuelsWonPercentage || 0;


            // Sum of the three metrics
            const totalMetricValue = ballRecovery + tackles + interceptions + clearances;

            if (
                stats.appearances >=3 &&
                totalDuelsWonPercentage >= 48  &&
                ballRecovery >= 3.5  &&
                totalMetricValue >= 9 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player);
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);
    }

    /**
     * Get Center Backs (DC)
     */
    async getDcPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: { $in: ['DC'] }
        });

        const players = [];
        const originalPlayers = [];
        for await (const player of cursor) {
            const stats = player.stats || {};

            // Calculate minutes per match
            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances || 0;

            // Required metrics from stats_per90
            const ballRecovery =this.per90(stats.ballRecovery,minutesPlayed)  || 0;
            const tackles =this.per90(stats.tackles,minutesPlayed)  || 0;
            const interceptions =this.per90(stats.interceptions,minutesPlayed)  || 0;
            const clearances =this.per90(stats.clearances,minutesPlayed)  || 0;

            const errorLeadToGoal =this.per90(stats.errorLeadToGoal,minutesPlayed)  || 0;
            const aerialDuelsWonPercentage =stats.totalDuelsWonPercentage || 0;


            // Sum of the three metrics
            const totalMetricValue = ballRecovery + tackles + interceptions + clearances;

            if (
                stats.appearances >=3 &&
                aerialDuelsWonPercentage >= 48  &&
                errorLeadToGoal <= 0.15  &&
                totalMetricValue >= 11 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player);
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);
    }

    /**
     * Get Goalkeepers (GK)
     */
    async getGkPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({
            positions: { $in: ['GK'] }
        });

        const players = [];
        const originalPlayers = [];
        for await (const player of cursor) {
            const stats = player.stats || {};

            // Calculate minutes per match
            const minutesPlayed = stats.minutesPlayed || 0;
            const minutesPerMatch = minutesPlayed / stats.appearances || 0;

            // Required metrics from stats_per90
            const saves =stats.saves || 0;
            const goalsConceded =stats.goalsConceded || 0;

            const goalsPrevented =stats.goalsPrevented || 0;


            // Sum of the three metrics
            const totalMetricValue = (saves/(saves + goalsConceded)) * 100;

            if (
                stats.appearances >=3 &&
                goalsPrevented >= 0  &&
                totalMetricValue >= 70 &&
                minutesPerMatch >= 25
            ) {
                players.push({
                    player: formatPlayerData(player),
                    totalMetricValue: totalMetricValue
                });
                originalPlayers.push(player);
            }
        }

        // Sort by total metric value (descending)
        const sortedData = players
            .map((item, index) => ({ ...item, originalIndex: index }))
            .sort((a, b) => b.totalMetricValue - a.totalMetricValue);

        // Extract sorted players and corresponding originals IN SAME ORDER
        const finalPlayers = sortedData.map(item => item.player);
        const sortedOriginalPlayers = sortedData.map(item => originalPlayers[item.originalIndex]);

        const playersWithIds = addSequentialIds(finalPlayers);

        // ML insights ekle (AYNI SIRADA gönder!)
        return await mlService.enrichPlayers(playersWithIds, sortedOriginalPlayers);
    }



    /**
     * Get player by name with all fields except _id, season, sofascore_id, scraped_at
     */
    async getPlayerByName(name) {
        const collection = this.getCollection();
        const originalPlayer = await collection.findOne(
            { name: name }
        );

        if (!originalPlayer) {
            return null;
        }

        // Format player data for client
        const formattedPlayer = {
            ...originalPlayer,
            _id: undefined,
            season: undefined,
            sofascore_id: undefined,
            scraped_at: undefined
        };

        // Format market_value and positions
        if (formattedPlayer.market_value !== undefined) {
            formattedPlayer.market_value = formatMarketValue(formattedPlayer.market_value);
        }

        if (Array.isArray(formattedPlayer.positions)) {
            formattedPlayer.positions = formattedPlayer.positions.join(',');
        }

        // Add ML insights
        const enrichedPlayer = await mlService.addMLInsights(formattedPlayer, originalPlayer);

        return enrichedPlayer;
    }

    /**
     * Get all players for form analysis
     */
    async getFormPlayers() {
        const collection = this.getCollection();
        const cursor = collection.find({});

        const players = [];
        for await (const player of cursor) {
            players.push(formatPlayerData(player));
        }

        return players;
    }
}

module.exports = new PlayerService();