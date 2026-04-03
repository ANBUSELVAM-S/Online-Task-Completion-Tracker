require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const fixUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Get the Counter model from the User file
    const Counter = mongoose.model('Counter');
    
    // Reset the counter
    await Counter.updateOne({ _id: 'userId' }, { $set: { seq: 0 } }, { upsert: true });

    // We use the raw collection to bypass Mongoose schema validation momentarily 
    // since we're converting strings to numbers
    const usersCollection = mongoose.connection.db.collection('users');
    const users = await usersCollection.find({}).toArray();
    
    let id = 1;
    for (const user of users) {
      await usersCollection.updateOne(
        { _id: user._id }, 
        { $set: { userId: id } }
      );
      console.log('Updated', user.email, 'to userId:', id);
      id++;
    }

    // Set counter to the latest ID
    await Counter.updateOne({ _id: 'userId' }, { $set: { seq: id - 1 } });
    console.log('Fixed existing users');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing users:', error.message);
    process.exit(1);
  }
};

fixUsers();
