const { testConnection, syncDatabase } = require('./config/database');

async function test() {
    console.log('Testing PostgreSQL connection...\n');

    const isConnected = await testConnection();

    if (isConnected) {
        console.log('\n✅ Connection successful!');
        console.log('Syncing database tables...\n');
        await syncDatabase();
        console.log('\n✅ Database is ready!');
    } else {
        console.log('\n❌ Connection failed!');
        console.log('Please check your DATABASE_URL in .env file');
    }

    process.exit(0);
}

test();
