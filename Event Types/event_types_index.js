const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const app = express();
app.use(express.json());

const sequelize = new Sequelize( {
  host: 'localhost',
  dialect: 'sqlite',
  storage: './event_types.db',
});

const EventType = sequelize.define('EventType', {
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
    app.post('/api/event_type/create', async (req, res) => {
        try {
          const { name } = req.body;
          if (!name) { 
            res.status(422).json({ error: 'All parameters must be provided and must be non-empty strings.' });
            return;
          }
          if (name.length < 2 || name.length > 255) {
            res.status(422).json({ error: 'The name must be between 2 and 255 characters.' });
            return;
          }
          const eventType = await EventType.create({ name });
          res.status(200).json(eventType);
        } catch (error) {
          res.status(500).json({ error: 'Internal Server Error' });
        }
      });
          })
.catch((error) => {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
});

app.listen(3000, () => {  
    console.log(`Example app listening at http://localhost:3000/api/event_type/create`)
    console.log(`Press Ctrl+C to exit...`)  
});