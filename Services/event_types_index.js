const { DataTypes } = require('sequelize');

const sequelize = require('./database');

const EventType = sequelize.define("EventType", {
  name: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      len: [2, 255],
      notEmpty: true,
    },
  },
},
{
  timestamps: false,
}
);

module.exports = { EventType };