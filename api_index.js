const sequelize = require('./Services/database');

const {User} = require('./Services/user_index');
const {Organizer} = require('./Services/organizer_index');
const {EventType} = require('./Services/event_types_index');
const {Event} = require('./Services/event_index');
const {Reservation} = require('./Services/reservations_index');

const sqlite3 = require('sqlite3').verbose(); // include sqlite library

const express = require('express');
const { where } = require('sequelize');
const e = require('express');
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
    if(!/^[a-zA-Z]+$/.test(firstname)){
      res.status(422).json({
        error: "The first name must contain only alphabetical characters.",
      });
      return;
    }
    if(!/^[a-zA-Z]+$/.test(lastname)){
      res.status(422).json({
        error: "The last name must contain only alphabetical characters.",
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
    const user_id = parseInt(id);

    if(isNaN(user_id)){
      res.status(422).json({ error: "User ID is not a number." });
      return;
    }

    if(user_id < 0){
      res.status(422).json({ error: "User ID is a negative number" });
      return;
    }

    const user = await User.findByPk(id).catch();

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

app.delete("/api/user/delete", async (req, res) => {
  try {
    const { id } = req.query;
    const userID = parseInt(id);

    if(isNaN(userID)){
      res.status(422).json({ error: "User ID is not a number" });
      return;
    }

    if(userID < 0){
      res.status(422).json({ error: "User ID is a negative number" });
      return;
    }

    const user = await User.findByPk(id).catch();

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const reservations = await Reservation.findByPk(id).catch();
    if  (reservations) {
      res.status(409).json({ error: "User has reservations, therefore cannot be deleted." });
      return;
    }

    
    await user.destroy();
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
})

app.put("/api/user/update", async (req, res) => {
  try {
    const { id, username, firstname, lastname } = req.body;
    const userID = parseInt(id);

    if(isNaN(userID)){
      res.status(422).json({ error: "User ID is not a number" });
      return;
    }

    if(userID < 0){
      res.status(422).json({ error: "User ID is a negative number" });
      return;
    }

    const user = await User.findByPk(id).catch();

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    if (!id ||!username || !firstname || !lastname) {
      res.status(422).json({ error: "All parameters must be provided and must be non-empty strings.", });
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      res.status(422).json({
        error: "The username must contain only alphanumeric characters.",
      });
      return;
    }

    if(!/^[a-zA-Z]+$/.test(firstname)){
      res.status(422).json({
        error: "The first name must contain only alphabetical characters.",
      });
      return;
    }
    if(!/^[a-zA-Z]+$/.test(lastname)){
      res.status(422).json({
        error: "The last name must contain only alphabetical characters.",
      });
      return;
    }

    if (username.length < 2) {
      res
        .status(422)
        .json({ error: "The username must be at least 2 characters long." });
      return;
    }

    await User.update({ username, firstname, lastname }, { where: { id } });
    const updatedUser = await User.findByPk(id).catch();
    res.status(200).json(updatedUser);
    } 
    catch (error) 
    {
      res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
  })   

app.get("/api/user", async (req, res) => {
  try {
    const { eventID } =  req.query;

    if (eventID) {

      if (isNaN(eventID)) {
        res.status(422).json({ error: "Event ID is not a number." });
        return;
      }

      const event = await Event.findByPk(eventID).catch;

      if (event) {
        const reservations = await  Reservation.findAll( {where: { eventID } });
        const users = await User.findAll({ where: { id: reservations.map(reservation => reservation.userID) } });
        res.status(200).json(users);
        return;
      }

      if (!event) {
        res.status(404).json({ error: "The eventID does not exist." });
        return;
      }
    }
    else {
      const users = await User.findAll();
      res.status(200).json(users);
    }  
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

//ORGANIZERS START
app.post("/api/organizer/create", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
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
    const existingOrganizer = await Organizer.findOne({ where: { name } });
    if (existingOrganizer) {
      res
        .status(409)
        .json({ error: "An organizer with the specified name already exists." });
      return;
    }
    const organizer = await Organizer.create({ id, name });
    res.status(200).json(organizer);
  } 
  catch (error)
  {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

app.delete("/api/organizer/delete/:id", async (req, res) => {
  try {
    const { id } = req.query;
    const organizerID = parseInt(id);

    if (isNaN(organizerID)) {
      res.status(422).json({ error: "All parameters must be provided and must benon-empty strings." });
      return;
    }

    if (organizerID < 0) {
      res.status(422).json({ error: "Organizer ID is a negative number." });
      return;
    }

    const organizer = await Organizer.findByPk(id).catch();
    if (!organizer) {
      res.status(404).json({ error: "Organizer not found." });
      return;
    }

    const events = await Event.findAll({ where: { organizerID } });
    if (events) {
      res.status(422).json({ error: "Organizer has events." });
      return;
    }

    await organizer.destroy();
    res.status(200).json({ message: "OK." });
  } 
  catch (error) 
  {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
})

app.get("/api/organizer", async (req, res) => {
  try {
    const { hasEvents } = req.query;

    if (hasEvents) {
      if (hasEvents === "true") {
        const events = await Event.findAll();
        const organizers = events.map(event => event.organizerID);
        const organizerNames = await Organizer.findAll({ where: { id: organizers } });
        res.status(200).json(organizerNames);
      }
      else if (hasEvents === "false") {
        const organizers = await Organizer.findAll();
        res.status(200).json(organizers);
      }
      else {
        res.status(422).json({ error: "All parameters must be provided and must be non-empty strings." });
        return;
      }
    }
    else
    {
      const organizers = await Organizer.findAll();
      res.status(200).json(organizers);
    }
    
    }
  catch (error) 
  {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
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

    if ( isNaN(eventTypeID) || isNaN(organizerID) || isNaN(price) || isNaN(locationLatitude) || isNaN(locationLongitude) || isNaN(maxParticipants) )
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

    if (isNaN(userID) || isNaN(eventID)) {
      res.status(422).json({ error: "You provided a wrong parameter." });
      return;
    }

    const users = await User.findByPk(userID).catch();
    if (!users) {
      res.status(404).json({ error: "The userID does not exist." });
      return;
    }

    const events = await Event.findByPk(eventID).catch();
    if (!events) {
      res.status(404).json({ error: "The eventID does not exist." });
      return;
    }

    const existingReservation = await Reservation.findOne({ where: { userID, eventID },});
    if (existingReservation) {
      res.status(409).json({ error: "User already has a reservation for this event." });
      return;
    }

    const eventmaxParticipants = await Event.findByPk(eventID).then((event) => event.maxParticipants);
    const reservationCount = await Reservation.count({ where: { eventID } });

    if (reservationCount >= eventmaxParticipants) {
      res.status(422).json({ error: "No slots available for this event." });
      return;
    }

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