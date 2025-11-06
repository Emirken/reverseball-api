const database = require('./src/config/database');
const playerService = require('./src/services/playerService');

async function testPlayerByName() {
    try {
        // Connect to database
        await database.connect();

        // Test with the player name from the request
        const playerName = 'Hamza Igamane';
        console.log(`\nSearching for player: ${playerName}`);

        const player = await playerService.getPlayerByName(playerName);

        if (player) {
            console.log('\n✅ Player found!');
            console.log('\nPlayer data (excluding season, sofascore_id, scraped_at):');
            console.log(JSON.stringify(player, null, 2));

            // Verify excluded fields
            console.log('\n🔍 Verification:');
            console.log(`- season field present: ${player.season !== undefined}`);
            console.log(`- sofascore_id field present: ${player.sofascore_id !== undefined}`);
            console.log(`- scraped_at field present: ${player.scraped_at !== undefined}`);
        } else {
            console.log('\n❌ Player not found');
        }

        await database.close();
    } catch (error) {
        console.error('Error:', error);
        await database.close();
    }
}

testPlayerByName();
