const mongoose = require('mongoose');

// MongoDB Atlas connection string with the new password
const MONGODB_URI = 'mongodb+srv://kafil:admin0@cluster0.94n2uma.mongodb.net/invoice-tracker?retryWrites=true&w=majority&appName=Cluster0';

console.log('Attempting to connect to MongoDB Atlas...');

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000 // Give it a bit more time
  })
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas!');
    console.log('Connection state:', mongoose.connection.readyState);
    // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    
    // List all collections in the database
    mongoose.connection.db.listCollections().toArray()
      .then(collections => {
        console.log('Available collections:');
        collections.forEach(collection => {
          console.log(` - ${collection.name}`);
        });
        
        // Close the connection after our test
        mongoose.connection.close();
        console.log('Connection closed');
      });
  })
  .catch(error => {
    console.error('Failed to connect to MongoDB Atlas');
    console.error('Error details:', error);
  }); 