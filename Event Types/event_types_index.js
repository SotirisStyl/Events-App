const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const app = express();
app.use(express.json());

const sequelize = new Sequelize( {
  host: 'localhost',
  dialect: 'sqlite',
  storage: './users.db',
});

const EventType = sequelize.define('EventType', {
id: {
    type: DataTypes.INTEGER,
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
});

sequelize.sync() .then(() => {
    app.post('/api/organizer/create', async (req, res) => {
        try {
          const { id, name } = req.body;
          if (!id || !name) {
            res.status(422).json({ error: 'All parameters must be provided and must be non-empty strings.' });
            return;
          }
          if (name.length < 2 || name.length > 255) {
            res.status(422).json({ error: 'The name must be between 2 and 255 characters.' });
            return;
          }
          const existingEventType = await EventType.findOne({ where: { id } });
          if (existingEventType) {
            res.status(409).json({ error: 'A room with the specified code already exists.' });
            return;
          }
          const eventType = await EventType.create({ id, name });
          res.status(200).json(eventType);
        } catch (error) {
          res.status(500).json({ error: 'Internal Server Error' });
        }
      });
})
.catch((error) => {
    console.error('Error synchronizing database:', error);
    process.exit(1);
});

app.listen(3000, () => {
    console.log(`Example app listening at http://localhost:3000/api/organizer/create`)
    console.log(`Press Ctrl+C to exit...`)
});