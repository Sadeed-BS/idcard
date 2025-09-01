const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  googleId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  age: { type: Number },
  phoneNumber: { type: String },
  passoutYear: { type: Number },
  department: { type: String },
  team: { type: String },
  uniqueId: { type: String, required: true, unique: true },
  registrationDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Student', StudentSchema);