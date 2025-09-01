const express = require('express');
const connectDB = require('./config/db');
const session = require('express-session');
const passport = require('passport');  

require('dotenv').config();

require('./config/passport')(passport);

const app = express();


connectDB();

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('Student Registration API Running'));

app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/auth', require('./routes/authRoutes')); 

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));