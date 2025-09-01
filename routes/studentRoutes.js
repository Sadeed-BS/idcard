const express = require('express');
const router = express.Router();
const {
    getStudentProfile,
    updateStudentProfile,
    getAllStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    verifyStudentByQRCode,
    getStudentQRCode,
    sendIdCardToStudent,
} = require('../controllers/studentController');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const { protect: protectAdmin, admin } = require('../middleware/authMiddleware');
const { protectStudent } = require('../middleware/studentAuthMiddleware');

router.get('/auth/google', passport.authenticate('google-student', { scope: ['profile', 'email'] }));

router.get(
  '/auth/google/callback',
  passport.authenticate('google-student', { failureRedirect: '/' }),
  (req, res) => {
    const student = req.user; 
    const token = jwt.sign({ id: student.id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    res.status(200).json({
      message: "Student authenticated successfully",
      token: token,
      student: {
        id: student.id,
        name: student.name,
        email: student.email
      }
    });
  }
);

router.route('/me')
    .get(protectStudent, getStudentProfile)
    .put(protectStudent, updateStudentProfile);
    
router.get('/me/qrcode', protectStudent, getStudentQRCode);
router.route('/').get([protectAdmin, admin], getAllStudents);
router.post('/verify', [protectAdmin, admin], verifyStudentByQRCode);
router.post('/:id/send-id-card', [protectAdmin, admin], sendIdCardToStudent);
router.get('/:id/qrcode', [protectAdmin, admin], getStudentQRCode);
router.route('/:id')
    .get([protectAdmin, admin], getStudentById)
    .put([protectAdmin, admin], updateStudent)
    .delete([protectAdmin, admin], deleteStudent);

module.exports = router;