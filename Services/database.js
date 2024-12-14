// Services/database.js
const { Sequelize } = require('sequelize');

// Create a Sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'db/database.db', // Path to your SQLite database
});

// Export the instance
module.exports = sequelize;
