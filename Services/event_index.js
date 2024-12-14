const { DataTypes } = require('sequelize');

const sequelize = require('./database');

const Event = sequelize.define(
  "Event",
  {
    eventTypeID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isNumeric: true,
        notEmpty: true,
      },
    },
    organizerID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isNumeric: true,
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 255],
        notEmpty: true,
      },
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isNumeric: true,
        notEmpty: true,
      },
    },
    dateTime: {
      allowNull: false,
      type: DataTypes.INTEGER,
      validate: {
        isNumeric: true,
        notEmpty: true,
      },
    },
    locationLatitude: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      validate: {
        isNumeric: true,
        notEmpty: true,
      },
    },
    locationLongitude: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      validate: {
        isNumeric: true,
        notEmpty: true,
      },
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isNumeric: true,
        notEmpty: true,
      },
    },
  },
  {
    timestamps: false,
  }
);

module.exports = { Event };