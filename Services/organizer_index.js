const { DataTypes } = require('sequelize');

const sequelize = require('./database');

const Organizer = sequelize.define(
  "Organizer",
  {
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

module.exports = { Organizer };