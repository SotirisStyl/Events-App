Implementation of an API for CO3411
The following specification must be followed in a way that demonstrates your understanding
of the RESTful approach. You must use the following tools for this assignment:
• The services must be implemented using Node.js and Express.js.
• For persistence, you need to use either SQLite or Sequelize.
You must also make the following assumptions:
• Services may be used concurrently. Therefore, you must use transactions where
necessary to ensure that any checks and subsequent update operations are carried
out atomically to maintain consistency.
• The quality of the code must also be inspected using an appropriate testing
strategy. You must provide evidence of testing using automated scripts for some
aspects of your implementation.
System model
The event planning backend comprises of the following data entities. You are expected to
create the database structure and map this model to a valid set of types and constraints in your
database tables.
API Structer:
![image](https://github.com/user-attachments/assets/80ee4f3a-6d3e-4765-aef7-c50428b2c14e)
