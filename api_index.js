const sequelize = require('./Services/database');

// Required Models in order for the app to work
const {User} = require('./Services/user_index');
const {Organizer} = require('./Services/organizer_index');
const {EventType} = require('./Services/event_types_index');
const {Event} = require('./Services/event_index');
const {Reservation} = require('./Services/reservations_index');

const sqlite3 = require('sqlite3').verbose(); //include sqlite library

const express = require('express'); //include express
const app = express();  //create express app
app.use(express.json()); //enable json parsing

const PORT = 3000; //port in order for the app to work on ejs

app.use (express.static('public')); 

const bodyParser = require('body-parser'); //include body-parser
app.use(bodyParser.urlencoded({ extended: true })); //enable body parsing
app.use(bodyParser.json()); //enable json parsing

const methodOverride = require('method-override'); //include method-override in order for the ejs to be able to use the PUT and DELETE methods
app.use(methodOverride('_method'));


app.set ('view engine', 'ejs');

app.get("/", (req, res) => {
  res.render("index");
});

//Method to create a new user
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

    if (firstname.length < 2){
      res.status(422).json({ error: "The firstname must be at least 2 characters." });
      return;
    }

    if (lastname.length < 2){
      res.status(422).json({ error: "The lastname must be at least 2 characters." });
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

//Method to get a specific user
app.get("/api/user/:ID", async (req, res) => {
  try {
    const { ID } = req.params;
    const user_id = parseInt(ID);

    if(isNaN(user_id)){
      res.status(422).json({ error: "User ID is not a number." });
      return;
    }

    if(user_id < 0){
      res.status(422).json({ error: "User ID cannot be a negative number" });
      return;
    }

    const user = await User.findByPk(ID);

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

//Method to delete a specific user
app.delete("/api/user/delete", async (req, res) => {
  try {
    const { ID } = req.query;
    const userID = parseInt(ID);

    if(isNaN(userID)){
      res.status(422).json({ error: "User ID is not a number" });
      return;
    }

    if(userID < 0){
      res.status(422).json({ error: "User ID cannot be a negative number" });
      return;
    }

    const user = await User.findByPk(ID);

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const reservations = await Reservation.findAll({ where: { userID } });
    if  (reservations) {
      res.status(422).json({ error: "User has reservations, therefore cannot be deleted." });
      return;
    }
    
    await user.destroy();
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

//Method to update a specific user
app.put("/api/user/update", async (req, res) => {
  try {
    const { id, username, firstname, lastname } = req.body;
    const userID = parseInt(id);

    if (!id ||!username || !firstname || !lastname) {
      res.status(422).json({ error: "All parameters must be provided and must be non-empty strings.", });
      return;
    }

    if(isNaN(userID)){
      res.status(422).json({ error: "User ID is not a number" });
      return;
    }

    if(userID < 0){
      res.status(422).json({ error: "User ID is a negative number" });
      return;
    }

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      res.status(422).json({
        error: "The username must contain only alphanumeric characters.",
      });
      return;
    }

    if (firstname < 2){
      res.status(422).json({ error: "The firstname must be at least 2 characters." });
      return;
    }

    if (lastname < 2){
      res.status(422).json({ error: "The lastname must be at least 2 characters." });
      return;
    }

    await User.update({ username, firstname, lastname }, { where: { id } });
    const updatedUser = await User.findByPk(id);
    res.status(200).json(updatedUser);
    } 
    catch (error) 
    {
      res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
});

//Method to get all users with optional eventID
app.get("/api/user", async (req, res) => {
  try {
    const { eventID } =  req.query;
    const eventID_int = parseInt(eventID);

    if (eventID_int) {

      if (isNaN(eventID_int)) {
        res.status(422).json({ error: "Event ID is not a number." });
        return;
      }

      const event = await Event.findByPk(eventID_int);

      if (event) {
        const reservations = await  Reservation.findAll( {where: { eventID_int } });
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

//Method to create an organizer
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

    const organizer = await Organizer.create({ name });
    res.status(200).json(organizer);
  } 
  catch (error)
  {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

//Method to delete an organizer
app.delete("/api/organizer/delete", async (req, res) => {
  try {
    const { ID } = req.query;
    const organizerID = parseInt(ID);

    if (isNaN(organizerID)) {
      res.status(422).json({ error: "All parameters must be provided and must be non-empty strings." });
      return;
    }

    if (organizerID < 0) {
      res.status(422).json({ error: "Organizer ID is a negative number." });
      return;
    }

    // Fix: Use organizerID instead of id
    const organizer = await Organizer.findByPk(organizerID);
    if (!organizer) {
      res.status(404).json({ error: "Organizer not found." });
      return;
    }

    // Fix: Properly check if the organizer has events
    const events = await Event.findAll({ where: { organizerID } });
    if (events.length > 0) {  // <- Correct way to check
      res.status(422).json({ error: "Organizer has events." });
      return;
    }

    await organizer.destroy();
    res.status(200).json({ message: "OK." });
  } 
  catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});


//Method to get all organizers with optional hasEvents
app.get("/api/organizer", async (req, res) => {
  try {
    const { hasEvents } = req.query;

    if (hasEvents) {
      if (hasEvents === "true" || hasEvents === "") {
        const events = await Event.findAll();   //fetch all events
        const organizers = events.map(event => event.organizerID);     //extract the organizers from the events
        const organizerNames = await Organizer.findAll({ where: { id: organizers } });   //extract the names from the organizers
        res.status(200).json(organizerNames);
      }
      else if (hasEvents === "false") {
        const organizers = await Organizer.findAll();
        res.status(200).json(organizers);
      }
      else {
        res.status(404).json({ error: "All parameters must be provided and must be true, false or nothing." });
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

//Method to create an event type
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

//Method to delete an event type
app.delete("/api/event-type/delete", async (req, res) => {
  try {
    const { ID } = req.query;
    const eventTypeID = parseInt(ID);

    if (isNaN(eventTypeID)) {
      res.status(422).json({ error: "All parameters must be provided and must be non-empty strings." });
      return;
    }

    if (eventTypeID < 0) {
      res.status(422).json({ error: "Event Type ID is a negative number." });
      return;
    }

    const eventType = await EventType.findByPk(ID);
    if (!eventType) {
      res.status(404).json({ error: "ID does not exist." });
      return;
    }

    const events = await Event.findAll({ where: { eventTypeID } });
    if (events) {
      res.status(422).json({ error: "Event Type has events therefore it cannot be deleted." });
      return;
    }

    await eventType.destroy();
    res.status(200).json({ message: "OK." });
  } 
  catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

//Method to get all event types
app.get("/api/event-types", async (req, res) => { 
  try {
    const eventTypes = await EventType.findAll();
    res.status(200).json(eventTypes);
  } 
  catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

//Method to create an event
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

    const eventTypes = await EventType.findByPk(eventTypeID);
    if (!eventTypes) {
      res.status(422).json({ error: "The eventTypeID does not exist." });
      return; 
    }

    const organizers = await Organizer.findByPk(organizerID);
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

    if (maxParticipants <= 0) {
      res.status(422).json({ error: "The maxParticipants must be a non-zero positive integer number." });
      return;
    }

    const event = await Event.create({eventTypeID, organizerID, name, price, dateTime, locationLatitude, locationLongitude, maxParticipants,});
    res.status(200).json(event);
  } 
  catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

//Method to delete an event
app.get("/api/event/delete", async (req, res) => {
  try {
    const { ID } = req.query;
    const eventID = parseInt(ID);

    if (isNaN(eventID)) {
      res.status(422).json({ error: "All parameters must be provided and must be non-empty strings." });
      return;
    }

    if (eventID < 0) {
      res.status(422).json({ error: "Event ID cannot be a negative number." });
      return;
    }

    const event = await Event.findByPk(ID);
    if (!event) {
      res.status(404).json({ error: "Event does not exist." });
      return;
    }

    const reservations = await Reservation.findAll({ where: { eventID } });
    if (reservations) {
      res.status(422).json({ error: "Event has reservations therefore it cannot be deleted." });
      return;
    }

    await event.destroy();
    res.status(200).json({ message: "Event deleted successfully." });
  } 
  catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

//Method to get an event
app.get("/api/event/:ID", async (req, res) => {
  try {
    const { ID } = req.params;
    const eventID = parseInt(ID);

    if (isNaN(eventID)) {
      res.status(422).json({ error: "Event ID needs to be a number" });
      return;
    }

    if (eventID < 0) {
      res.status(422).json({ error: "Event ID cannot be a negative number." });
      return;
    }

    const event = await Event.findByPk(ID);
    if (!event) {
      res.status(404).json({ error: "Event does not exist." });
      return;
    }

    res.status(200).json(event);
  } 
  catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

//Method to update an event
app.put("/api/event/update", async (req, res) => {
  try {
    const {id, eventTypeID, organizerID, name, price, dateTime, locationLatitude, locationLongitude, maxParticipants} = req.body;

    if (!id || !eventTypeID || !organizerID || !name || !price || !dateTime || !locationLatitude || !locationLongitude || !maxParticipants) {
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


    if (isNaN(id) || isNaN(eventTypeID) || isNaN(organizerID) || isNaN(price) || isNaN(locationLatitude) || isNaN(locationLongitude) || isNaN(maxParticipants)) {
      res.status(422).json({ error: "You provided a wrong parameter." });
      return;
    }

    const event = await Event.findByPk(id);
    if (!event) {
      res.status(404).json({ error: "The event does not exist." });
      return;
    }

    const eventTypes = await EventType.findByPk(eventTypeID);
    if (!eventTypes) {
      res.status(404).json({ error: "The eventTypeID does not exist." });
      return; 
    }

    const organizers = await Organizer.findByPk(organizerID);
    if (!organizers) {
      res.status(404).json({ error: "The organizerID does not exist." });
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

    if (maxParticipants <= 0) {
      res.status(422).json({ error: "The maxParticipants must be a non-negative number." });
      return;
    }

    await event.update({eventTypeID, organizerID, name, price, dateTime, locationLatitude, locationLongitude, maxParticipants});
    res.status(200).json(event);
  } 
  catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

const { Op } = require('sequelize'); //include Op to be able to define operations for the where clause

//Method to get all events with optional parameters
app.get("/api/event", async (req, res) => {
  try {
    const { organizerID, eventTypeID, dateTime, userIDs } = req.query;

    let where = {};

    if (organizerID) { //check if organizerID is provided
      const id1 = parseInt(organizerID);
      if (isNaN(id1)) {
        res.status(422).json({ error: "Invalid organizerID format" });
        return;
      }
      if (id1 < 0) {
        res.status(422).json({ error: "Organizer ID cannot be a negative number." });
        return;
      }
      where.organizerID = id1;
    }

    if (eventTypeID) { //check if eventTypeID is provided
      const id2 = parseInt(eventTypeID);
      if (isNaN(id2)) {
        res.status(422).json({ error: "Invalid eventTypeID format" });
        return;
      }
      if (id2 < 0) {
        res.status(422).json({ error: "Event Type ID cannot be a negative number." });
        return;
      }
      where.eventTypeID = id2;
    }

    if (dateTime) { //check if dateTime is provided
      const timestamp = parseInt(dateTime);
      if (isNaN(timestamp)) {
        res.status(422).json({ error: "Invalid dateTime format" });
        return;
      }
      if (timestamp < Date.now()) {
        res.status(422).json({ error: "Invalid or past date" });
        return;
      }
      where.dateTime = { [Op.eq]: timestamp };
    }

    if (userIDs) { //check if userIDs is provided
      const userIdsArray = userIDs.split(",");
      if (!userIdsArray.every((id) => !isNaN(parseInt(id)))) {
        res.status(422).json({ error: "Invalid userIDs format" });
        return;
      }
    
      if (userIdsArray.some((id) => parseInt(id) < 0)) {
        res.status(422).json({ error: "User ID cannot be a negative number." });
        return;
      }
    
      const events = await Event.findAll(); //fetch all events
      const eventIDs = events.map(event => event.id); //extract event IDs
      const reservations = await Reservation.findAll({ where: { eventID: { [Op.in]: eventIDs } } }); //fetch reservations for all events
      const filteredReservations = reservations.filter(reservation => userIdsArray.includes(reservation.userID.toString())); //filter reservations by user IDs
      const filteredEventIDs = filteredReservations.map(reservation => reservation.eventID); //extract event IDs
      const filteredEvents = events.filter(event => filteredEventIDs.includes(event.id)); //filter events by event IDs

      where.id = { [Op.in]: filteredEvents.map(event => event.id) }; //add filtered event IDs to where clause

    }

    const events = await Event.findAll({ where }); //fetch filtered events

    if (!events) {
      res.status(404).json({ error: "No events found" });
      return;
    }

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});


//Method to create a reservation
app.post("/api/reservation/create", async (req, res) => {
  try {
    const { eventID, userID  } = req.body;
    console.log(eventID, userID);
    if ( !eventID || !userID ) {
      res.status(422).json({ error: "All parameters must be provided." });
      return;
    }

    if ( isNaN(eventID) || isNaN(userID) ) {
      res.status(422).json({ error: "You provided a wrong parameter." });
      return;
    }

    const events = await Event.findByPk(eventID);
    if (!events) {
      res.status(404).json({ error: "The eventID does not exist." });
      return;
    }

    const users = await User.findByPk(userID);
    if (!users) {
      res.status(404).json({ error: "The userID does not exist." });
      return;
    }

    const existingReservation = await Reservation.findOne({ where: { userID, eventID },});
    if (existingReservation) {
      res.status(409).json({ error: "User already has a reservation for this event." });
      return;
    }

    const reservationCount = await Reservation.count({ where: { eventID: eventID } });
    if (reservationCount >= events.maxParticipants) {
      res.status(422).json({ error: "No slots available for this event." });
      return;
    }

    const reservation = await Reservation.create({ userID, eventID });
    return res.status(200).json(reservation);
  
  } 
  catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

//Method to get a reservation
app.get("/api/reservation/:ID", async (req, res) => {
  try {
    const { ID } = req.params;
    const reservationID = parseInt(ID);

    if (isNaN(reservationID)) {
      res.status(422).json({ error: "Reservation ID needs to be a number" });
      return;
    }

    if (reservationID < 0) {
      res.status(422).json({ error: "Reservation ID cannot be a negative number." });
      return;
    }

    const reservation = await Reservation.findByPk(reservationID);
    if (!reservation) {
      res.status(404).json({ error: "Reservation does not exist." });
      return; 
    }

    res.status(200).json(reservation);
  } 
  catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

//Method to delete a reservation
app.delete("/api/reservation/delete", async (req, res) => {
  try {
    const { ID } = req.query;
    const reservationID = parseInt(ID);

    if (!ID) {
      res.status(422).json({ error: "All parameters must be provided." });
      return;
    }

    if (isNaN(reservationID)) {
      res.status(422).json({ error: "Reservation ID needs to be a number" });
      return;
    }

    if (reservationID < 0) {
      res.status(422).json({ error: "Reservation ID cannot be a negative number." });
      return;
    }
  
    const reservation = await Reservation.findByPk(reservationID);
    if (!reservation) {
      res.status(404).json({ error: "Reservation does not exist." });
      return;
    }

    await reservation.destroy();

    res.status(200).json({ message: "Reservation deleted successfully." });
  } 
  catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

//Method to get all reservations with optional userIDs and eventIDs
app.get("/api/reservations", async (req, res) => {
  try {
    const { userIDs, eventIDs } = req.query;    

    if (!userIDs && !eventIDs) {
      const reservations = await Reservation.findAll();
      res.status(200).json(reservations);
      return;
    }

    if (eventIDs && !userIDs) {
      const eventID = parseInt(eventIDs);
      const event = await Event.findByPk(eventIDs);

      if (!event) {
        res.status(404).json({ error: "The eventID does not exist." });
        return;
      }

      if (eventID < 0) {
        res.status(422).json({ error: "Reservation ID cannot be a negative number." });
        return;
      }

      if (isNaN(eventID)) {
        res.status(422).json({ error: "You provided a wrong parameter." });
        return;
      }
      
      const reservations = await Reservation.findAll({ where: { eventID } });
      res.status(200).json(reservations);
      return;
    }
    else if (!eventIDs && userIDs) {
      const userID = parseInt(userIDs);
      const user = await User.findByPk(userID);

      if (!user) {
        res.status(404).json({ error: "The userID does not exist." });
        return;
      }

      if (userID < 0) {
        res.status(422).json({ error: "Reservation ID cannot be a negative number." });
        return;
      }

      if (isNaN(userID)) {
        res.status(422).json({ error: "You provided a wrong parameter." });
        return;
      }

      const reservations = await Reservation.findAll({ where: { userID } });
      res.status(200).json(reservations);
      return;
    }

    else if (eventIDs && userIDs) {
      res.status(422).json({ error: "The userID and eventID parameters cannot be provided together." });
      return;
    }
  } 
  catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

//Post Routs For Front End

//POST route to create a user
app.post("/users/create", (req, res) => {
  User.create({
    username: req.body.username,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
  }).then(() => res.redirect("/users"))
    .catch((err) => {
      console.error(err);
      res.redirect("/users");
    });
});

//POST route to find a user by ID
app.post("/users/find", (req, res) => {
  const userId = req.body.id;
  User.findByPk(userId)
    .then((user) => {
      User.findAll().then((users) => {
        res.render("users", { users, user: user || null });
      });
    })
    .catch((err) => {
      console.error(err);
      res.render("users", { users: [], user: null });
    });
});

//PUT route to update a user
app.put("/users/update", (req, res) => {
  const userId = parseInt(req.body.id);

  if (isNaN(userId) || userId <= 0) {
    return res.status(422).json({ error: "User ID is not a number." });
  }

  User.findByPk(userId)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User does not exist." });
      }

      user.username = req.body.username;
      user.firstname = req.body.firstname;
      user.lastname = req.body.lastname;

      return user.save();
    })
    .then(() => res.redirect("/users"))
    .catch((err) => {
      console.error(err);
      res.redirect("/users");
    });
});

//DELETE route to delete a user
app.delete("/users/delete", (req, res) => {
  const userId = parseInt(req.body.id);

  if (isNaN(userId) || userId <= 0) {
    return res.status(422).json({ error: "User ID is not a number." });
  }

  User.findByPk(userId)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User does not exist." });
      }
      return user.destroy();
    })
    .then(() => res.redirect("/users"))
    .catch((err) => {
      console.error(err);
      res.redirect("/users");
    });
});


//Get Route to display all users
app.get("/users", (req, res) => {
  User.findAll()
    .then((users) => {
      res.render("users", { users, user: null }); // Always pass user and users
    })
});

//Get Route to display all events
app.get("/events", (req, res) => {
  Event.findAll().then((events) => {
    res.render("events", { events });
  })
});

//Get Route to display all event types
app.get("/eventTypes", (req, res) => {
  EventType.findAll().then((eventTypes) => {
    res.render("eventTypes", { eventTypes });
  })
});

//Get Route to display all organizers
app.get("/organizers", (req, res) => {
  Organizer.findAll().then((organizers) => {
    res.render("organizers", { organizers });
  })
});

//Get Route to display all reservations
app.get("/reservations", (req, res) => {
  Reservation.findAll().then((reservations) => {
    res.render("reservations", { reservations });
  })
});

//Sync the database
sequelize.sync()
  .then(() => {
    console.log('Database connected');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error('Unable to connect to the database:', err));