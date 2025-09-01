const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const protectStudent = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.student = await Student.findById(decoded.id).select('-password -uniqueIdHashCode');
      
      if (!req.student) {
        return res.status(401).json({ msg: 'Not authorized, student not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ msg: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ msg: 'Not authorized, no token' });
  }
};

module.exports = { protectStudent };