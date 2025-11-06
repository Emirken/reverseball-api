require('dotenv').config();
const database = require('./src/config/database');

const oldEmails = [
    "alex@test.com",
    "maria@test.com",
    "james@test.com",
    "sophie@test.com",
    "lucas@test.com"
];

async function deleteOldUsers() {
    try {
        console.log('🔄 Connecting to database...');
        await database.connect();

        const usersCollection = database.getCollection('users');

        console.log('\n🗑️  Deleting old test users...\n');

        const result = await usersCollection.deleteMany({
            email: { $in: oldEmails }
        });

        console.log(`✅ Deleted ${result.deletedCount} old test users`);

        await database.close();
        console.log('\n✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error deleting old users:', error);
        await database.close();
        process.exit(1);
    }
}

deleteOldUsers();
