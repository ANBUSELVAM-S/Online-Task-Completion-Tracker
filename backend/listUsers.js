require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({}, 'email role');
    console.log('All users in DB:', users);
    process.exit(0);
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }
};

listUsers();
