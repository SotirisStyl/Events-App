const { DataTypes } = require('sequelize');

const sequelize = require('./database');

const User = sequelize.define(
  "User",
  {
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isAlphanumeric: true,
        notEmpty: true,
      },
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 255],
        notEmpty: true,
      },
    },
    lastname: {
      type: DataTypes.STRING,
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

module.exports = {  User };