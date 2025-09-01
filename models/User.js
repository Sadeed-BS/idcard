const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: { 
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    default: 'admin',
  },
});

module.exports = mongoose.model('User', UserSchema);