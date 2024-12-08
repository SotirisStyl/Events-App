const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const app = express();
app.use(express.json());

const sequelize = new Sequelize( {
  host: 'localhost',
  dialect: 'sqlite',
  storage: './users.db',
});

const User = sequelize.define('User', {
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
      len: [2, 50],
      notEmpty: true,
    },
  },
});

sequelize.sync() .then(() => {
    app.post('/api/user/create', async (req, res) => {
        try {
          const { username, firstname, lastname } = req.body;
          if (!username || !firstname || !lastname) {
            res.status(422).json({ error: 'All parameters must be provided and must be non-empty strings.' });
            return;
          }
          if (!/^[a-zA-Z0-9]+$/.test(username)) {
            res.status(422).json({ error: 'The username must contain only alphanumeric characters.' });
            return;
          }
          const existingUser = await User.findOne({ where: { username } });
          if (existingUser) {
            res.status(409).json({ error: 'A user with the specified username already exists.' });
            return;
          }
          const user = await User.create({ username, firstname, lastname });
          res.status(200).json(user);
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
    console.log(`Example app listening at http://localhost:3000/api/user/create`)
    console.log(`Press Ctrl+C to exit...`)
});