const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

router.get('/google', passport.authenticate('google-admin', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google-admin', { failureRedirect: '/' }),
  (req, res) => {
    // On successful authentication, req.user is available.
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    
    res.status(200).json({
      message: "Admin authenticated successfully",
      token: token,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      }
    });
  }
);

module.exports = router;