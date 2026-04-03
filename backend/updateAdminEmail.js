require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const updateAdminEmail = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update the admin user's email
    const result = await User.updateOne(
        { email: 'admin' }, 
        { $set: { email: 'taskmanager@gmail.com' } }
    );

    if (result.matchedCount === 0) {
        console.log('User "admin" not found.');
    } else if (result.modifiedCount === 0) {
        console.log('User "admin" was found, but email was already admin@gmail.com or no change was made.');
    } else {
        console.log('Successfully changed admin email to admin@gmail.com!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error updating admin email:', error);
    process.exit(1);
  }
};

updateAdminEmail();
