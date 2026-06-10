const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use SSL in production (Render), but not in local development
const isProduction = process.env.NODE_ENV === 'production';

// PostgreSQL connection
const sequelize = new Sequelize(process.env.DATABASE_URL || process.env.POSTGRES_URI, {
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
