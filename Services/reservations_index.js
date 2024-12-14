const { DataTypes } = require('sequelize');

const sequelize = require('./database');

const Reservation = sequelize.define(
    "Reservation",
    {
        eventID: {
            type: DataTypes.INTEGER,
            unique: true,
            allowNull: false,
            validate: {
                isNumeric: true,
                notEmpty: true,
            },
        },
        userID: {
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

module.exports = { Reservation };