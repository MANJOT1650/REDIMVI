const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use SSL in production (Render), but not in local development
const isProduction = process.env.NODE_ENV === 'production';

// PostgreSQL connection
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URI;

if (!dbUrl) {
    console.error('\n❌ FATAL ERROR: DATABASE_URL environment variable is missing.');
    console.error('If you are on Render, please go to your Web Service -> Environment, and add your DATABASE_URL.\n');
    // Exit the process gracefully
    process.exit(1);
}

const sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    dialectOptions: isProduction ? {
        ssl: {
            require: true,
            rejectUnauthorized: false // Required for Render's hosted PostgreSQL
        }
    } : {},
    logging: isProduction ? false : console.log,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Test connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✓ PostgreSQL connected successfully');
        return true;
    } catch (error) {
        console.error('⚠ PostgreSQL connection failed:', error.message);
        return false;
    }
};

// Sync database (create tables if they don't exist)
const syncDatabase = async () => {
    try {
        await sequelize.sync({ alter: true }); // Automatically update table schema with new columns
        console.log('✓ Database synchronized');
    } catch (error) {
        console.error('Database sync error:', error);
    }
};


module.exports = {
    sequelize,
    testConnection,
    syncDatabase
};
