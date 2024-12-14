const sequelize = require('./Services/database');

const {User} = require('./Services/user_index');
const {Organizer} = require('./Services/organizer_index');
const {EventType} = require('./Services/event_types_index');
const {Event} = require('./Services/event_index');
const {Reservation} = require('./Services/reservations_index');

const express = require('express');
const app = express();
app.use(express.json());

const PORT = 3000;

//USER START
app.post("/api/user/create", async (req, res) => {
  try {
    const { username, firstname, lastname } = req.body;
    if (!username || !firstname || !lastname) {
      res.status(422).json({
        error: "All parameters must be provided and must be non-empty strings.",
      });
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      res.status(422).json({
        error: "The username must contain only alphanumeric characters.",
      });
      return;
    }
    if (username.length < 2) {
      res
        .status(422)
        .json({ error: "The username must be at least 2 characters long." });
      return;
    }
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      res
        .status(409)
        .json({ error: "A user with the specified username already exists." });
      return;
    }
    const user = await User.create({ username, firstname, lastname });
    res.status(200).json(user);
  } 
    catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

app.get("/api/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if(id < 0){
      res.status(422).json({ error: "User not found." });
      return;
    }
    if(typeof id !== "number"){
      res.status(422).json({ error: "User not found." });
      return;
    }
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

app.delete("/api/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if(id < 0){
      res.status(422).json({ error: "User not found." });
      return;
    }
    if(typeof id !== "number"){
      res.status(422).json({ error: "User not found." });
      return;
    }

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    
    await user.destroy();
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
})

//ORGANIZERS START
app.post("/api/organizer/create", async (req, res) => {
  try {
    const { id, name } = req.body;
    if (!id || !name) {
      res.status(422).json({
        error: "All parameters must be provided and must be non-empty strings.",
      });
      return;
    }
    if (name.length < 2 || name.length > 255) {
      res
        .status(422)
        .json({ error: "The name must be between 2 and 255 characters." });
      return;
    }
    const existingOrganizer = await Organizer.findOne({ where: { id } });
    if (existingOrganizer) {
      res
        .status(409)
        .json({ error: "An organizer with the specified ID already exists." });
      return;
    }
    const organizer = await Organizer.create({ id, name });
    res.status(200).json(organizer);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
});

//EVENT TYPES START
app.post("/api/event-type/create", async (req, res) => {
  try {

    const { name } = req.body;

    if (!name) {
      res.status(422).json({ error: "All parameters must be provided and must be non-empty strings.", });
      return;
    }

    if (name.length < 2 || name.length > 255) {
      res.status(422).json({ error: "The name must be between 2 and 255 characters." });
      return;
    }

    const existingEventType = await EventType.findOne({ where: { name } });
    if (existingEventType) {
      res.status(409).json({error: "An event type with the specified name already exists.",});
      return;
    }

    const eventType = await EventType.create({ name });
    res.status(200).json(eventType);

  } 
  catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message  });
  }
});

app.get("/api/event-type", async (req, res) => {
  try {
    const eventTypes = await EventType.findAll();
    res.status(200).json(eventTypes);
  } 
  catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

//EVENTS START
app.post("/api/event/create", async (req, res) => {
  try {
    const { eventTypeID, organizerID, name, price, dateTime, locationLatitude, locationLongitude, maxParticipants, } = req.body;

    if ( !eventTypeID || !organizerID || !name || !price || !dateTime || !locationLatitude || !locationLongitude || !maxParticipants ) 
    {
      res.status(422).json({ error: "All parameters must be provided." });
      return;
    }

    if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
      res.status(422).json({ error: "The name must contain only letters, numbers, and spaces." });
      return;
    }

    if (name.length < 2 || name.length > 255) {
      res.status(422).json({ error: "The name must be between 2 and 255 characters." });
      return;
    }

    if ( typeof price !== "number" || typeof dateTime !== "number" || typeof locationLatitude !== "number" || typeof locationLongitude !== "number" || typeof maxParticipants !== "number")
      {
      res.status(422).json({ error: "You provided a wrong parameter." });
      return;
    }

    const eventTypes = await EventType.findByPk(eventTypeID).catch();
    if (!eventTypes) {
      res.status(422).json({ error: "The eventTypeID does not exist." });
      return; 
    }

    const organizers = await Organizer.findByPk(organizerID).catch();
    if (!organizers) {
      res.status(422).json({ error: "The organizerID does not exist." });
      return; 
    }

    if (Date.now() > dateTime) {
      res.status(422).json({ error: "Invalid or past date" });
      return;
    }

    if (price < 0) {
      res.status(422).json({ error: "The price must be a non-negative number." });
      return;
    }

    if (locationLatitude < -90 || locationLatitude > 90) {
      res.status(422).json({ error: "The locationLatitude must be a number between -90 and 90.", });
      return;
    }

    if (locationLongitude < -180 || locationLongitude > 180) {
      res.status(422).json({ error: "The locationLongitude must be a number between -180 and 180.", });
      return;
    }

    if (maxParticipants < 0) {
      res.status(422).json({ error: "The maxParticipants must be a non-negative number." });
      return;
    }

    const event = await Event.create({eventTypeID, organizerID, name, price, dateTime, locationLatitude, locationLongitude, maxParticipants,});
    res.status(200).json(event);
  } 
  catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

//RESERVATIONS START

app.post("/api/reservation/create", async (req, res) => {
  try {
    const { userID, eventID } = req.body;
    if (!userID || !eventID) {
      res.status(422).json({ error: "All parameters must be provided." });
      return;
    }

    if (typeof userID !== "number" || typeof eventID !== "number") {
      res.status(422).json({ error: "You provided a wrong parameter." });
      return;
    }

    const users = await User.findByPk(userID).catch();
    if (!users) {
      res.status(404).json({ error: "The userID does not exist." });
      return;
    }

    const events = await Event.findByPk(eventID).catch;
    if (!events) {
      res.status(404).json({ error: "The eventID does not exist." });
      return;
    }

    const existingReservation = await Reservation.findOne({ where: { userID, eventID },});
    if (existingReservation) {
      res.status(409).json({ error: "User already has a reservation for this event." });
      return;
    }

    // const currentReservationsCount = await Reservation.findOne({order: [['id', 'DESC']], where: {eventID: eventID} });
    // if (currentReservationsCount > Event.maxParticipants) {
    //   res.status(422).json({ error: "No slots available for this event." });
    //   return;
    // }

    const reservation = await Reservation.create({ userID, eventID });
    res.status(200).json(reservation);
  } 
  catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});


sequelize.sync()
  .then(() => {
    console.log('Database connected');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error('Unable to connect to the database:', err));