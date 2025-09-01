const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const { sendEmail } = require('../services/emailService');
const { generateIdCard } = require('../services/idCardService');

module.exports = function (passport) {

  passport.use('google-admin', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    const newUser = {
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      role: 'admin'
    };
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (user) {
        done(null, user);
      } else {
        user = await User.create(newUser);
        done(null, user);
      }
    } catch (err) {
      console.error(err);
      done(err, null);
    }
  }));


  passport.use('google-student', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/students/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let student = await Student.findOne({ googleId: profile.id });

      if (student) {
        done(null, student);
      } else {
        const uniqueId = uuidv4();
        
        const newStudentData = {
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          uniqueId,
        };
        student = await Student.create(newStudentData);

        if (student) {
            console.log('New student registered, generating ID card and sending welcome email...');
            const idCardPath = await generateIdCard(student);
            const subject = 'Welcome to SEDS CUSAT!';
            const htmlMessage = `<p>Hi ${student.name},</p><p>Welcome to SEDS CUSAT! Your digital ID card is attached.</p>`;
            const attachments = [{ filename: 'SEDS_CUSAT_ID_Card.png', path: idCardPath }];

            await sendEmail(student.email, subject, htmlMessage, attachments);
            fs.unlinkSync(idCardPath);
            console.log('Temporary ID card file deleted.');
        }

        done(null, student);
      }
    } catch (err) {
      console.error(err);
      done(err, null);
    }
  }));
  
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      if (user) {
        return done(null, user);
      }
  
      const student = await Student.findById(id);
      done(null, student);

    } catch (err) {
      done(err, null);
    }
  });
};