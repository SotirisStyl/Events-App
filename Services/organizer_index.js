const { DataTypes } = require('sequelize');

const sequelize = require('./database');

const Organizer = sequelize.define(
  "Organizer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      unique: true,
      allowNull: false,
      validate: {
        isNumeric: true,
        notEmpty: true,
      },
    },
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