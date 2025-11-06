require('dotenv').config();
const database = require('./src/config/database');
const bcrypt = require('bcryptjs');

const testUsers = [
    {
        name: "Test1",
        email: "test1@test.com",
        password: "Test123",
        scoutType: "freelance",
        subscriptionType: "individual",
        billingPeriod: "monthly"
    },
    {
        name: "Test2",
        email: "test2@test.com",
        password: "Test123",
        scoutType: "club",
        subscriptionType: "team",
        billingPeriod: "yearly",
        leagueCountry: "Spain",
        clubName: "Real Madrid"
    },
    {
        name: "Test3",
        email: "test3@test.com",
        password: "Test123",
        scoutType: "agency",
        subscriptionType: "enterprise",
        billingPeriod: "yearly"
    },
    {
        name: "Test4",
        email: "test4@test.com",
        password: "Test123",
        scoutType: "club",
        subscriptionType: "team",
        billingPeriod: "monthly",
        leagueCountry: "England",
        clubName: "Manchester United"
    },
    {
        name: "Test5",
        email: "test5@test.com",
        password: "Test123",
        scoutType: "freelance",
        subscriptionType: "individual",
        billingPeriod: "yearly"
    }
];

async function createTestUsers() {
    try {
        console.log('🔄 Connecting to database...');
        await database.connect();

        const usersCollection = database.getCollection('users');

        console.log('\n📝 Creating test users...\n');

        for (const userData of testUsers) {
            // Check if user already exists
            const existingUser = await usersCollection.findOne({ email: userData.email });

            if (existingUser) {
                console.log(`⚠️  User ${userData.email} already exists, skipping...`);
                continue;
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            // Prepare user document
            const newUser = {
                ...userData,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Insert user
            await usersCollection.insertOne(newUser);
            console.log(`✅ Created user: ${userData.name} (${userData.email})`);
            console.log(`   Scout Type: ${userData.scoutType}`);
            console.log(`   Subscription: ${userData.subscriptionType} - ${userData.billingPeriod}`);
            if (userData.clubName) {
                console.log(`   Club: ${userData.clubName} (${userData.leagueCountry})`);
            }
            console.log('');
        }

        console.log('\n✅ All test users created successfully!');
        console.log('\n📋 Test User Credentials:');
        console.log('=' .repeat(60));
        testUsers.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${user.password}`);
            console.log(`   Type: ${user.scoutType} | ${user.subscriptionType} | ${user.billingPeriod}`);
            if (user.clubName) {
                console.log(`   Club: ${user.clubName} (${user.leagueCountry})`);
            }
        });
        console.log('\n' + '='.repeat(60));

        await database.close();
        console.log('\n✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error creating test users:', error);
        await database.close();
        process.exit(1);
    }
}

createTestUsers();
