const { Sequelize } = require('sequelize');
require('dotenv').config();

// PostgreSQL connection
const sequelize = new Sequelize(process.env.DATABASE_URL || process.env.POSTGRES_URI, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // For hosted databases like Render
        }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
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
        await sequelize.sync({ alter: false }); // Use { force: true } to drop and recreate tables
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
