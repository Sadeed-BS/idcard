const fs = require('fs');
const Student = require('../models/Student');
const QRCode = require('qrcode');
const { generateIdCard } = require('../services/idCardService');
const { sendEmail } = require('../services/emailService');

exports.getStudentProfile = async (req, res) => {
  res.json(req.student);
};


exports.updateStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.student._id);

    if (student) {
      student.name = req.body.name || student.name;
      student.age = req.body.age || student.age;
      student.phoneNumber = req.body.phoneNumber || student.phoneNumber;
      student.passoutYear = req.body.passoutYear || student.passoutYear;
      student.department = req.body.department || student.department;
      student.team = req.body.team || student.team;
      
      const updatedStudent = await student.save();
      
      res.json(updatedStudent);
    } else {
      res.status(404).json({ msg: 'Student not found' });
    }
  } catch (err) {
    console.error("Error updating student profile:", err.message);
    res.status(500).send('Server Error');
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password -googleId');
    res.json(students);
  } catch (err) {
    console.error('Error in getAllStudents:', err.message);
    res.status(500).send('Server Error');
  }
};


exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password -googleId');

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    console.error('Error in getStudentById:', err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Student not found (Invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
};


exports.updateStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!student) return res.status(404).json({ msg: 'Student not found' });
        res.json({ msg: 'Student details updated successfully', student });
      } catch (err) {
        console.error('Error in updateStudent:', err.message);
        res.status(500).send('Server Error');
      }
};


exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
        return res.status(404).json({ msg: 'Student not found' });
    }

    res.json({ msg: 'Student removed successfully' });

  } catch (err) {
    console.error('Error in deleteStudent:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.getStudentQRCode = async (req, res) => {
  try {
    let student;
    if (req.student) {
      student = req.student;
    } 
    else if (req.user && req.user.role === 'admin') {
      student = await Student.findById(req.params.id);
    }

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    const qrCodeDataUrl = await QRCode.toDataURL(student.uniqueId, {
      errorCorrectionLevel: 'H', type: 'image/png', quality: 0.92, margin: 1,
    });
    
    res.json({
      studentId: student._id,
      studentName: student.name,
      qrCode: qrCodeDataUrl,
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    res.status(500).send('Server Error');
  }
};

exports.verifyStudentByQRCode = async (req, res) => {
  const { uniqueId } = req.body;
  if (!uniqueId) {
    return res.status(400).json({ msg: 'Unique ID is required for verification.' });
  }

  try {
    const student = await Student.findOne({ uniqueId }).select('-password -googleId'); 
    if (!student) {
      return res.status(404).json({ msg: 'Verification failed: No student found with this ID.' });
    }

    res.json({ 
      message: 'Verification successful',
      student: student
    });
  } catch (err) {
    console.error('Error in verifyStudentByQRCode:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.sendIdCardToStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    console.log(`Admin request received. Generating ID card for ${student.name}...`);
    const idCardPath = await generateIdCard(student);
    const subject = 'Your SEDS CUSAT Digital ID Card';
    const htmlMessage = `<p>Hi ${student.name},</p><p>As requested by a SEDS CUSAT administrator, here is a copy of your official digital ID card.</p>`;
    const attachments = [{ filename: 'SEDS_CUSAT_ID_Card.png', path: idCardPath }];

    await sendEmail(student.email, subject, htmlMessage, attachments);
    fs.unlinkSync(idCardPath);

    res.json({ msg: `ID card sent successfully to ${student.email}` });
  } catch (err) {
    console.error('Error in sendIdCardToStudent:', err.message);
    res.status(500).send('Server Error');
  }
};