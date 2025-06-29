const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ApplicantProfile = require('../models/ApplicantProfile');
const {
  updateApplicantProfile,
  getApplicantProfile,
} = require('../controllers/applicantController');

// Multer konfiqurasiyası
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'resume') {
      cb(null, 'uploads/resumes');
    } else if (file.fieldname === 'profilePicture') {
      cb(null, 'uploads/profilePictures');
    } else {
      cb(new Error('Invalid fieldname'), null);
    }
  },
  filename: function (req, file, cb) {
    const extname = path.extname(file.originalname);
    cb(null, `${uuidv4()}${extname}`);
  },
});
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Yalnız PDF, DOC və DOCX fayllarına icazə verilir!'), false);
    }
  } else if (file.fieldname === 'profilePicture') {
    if (
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/gif'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Yalnız JPEG, PNG və GIF şəkillərinə icazə verilir!'), false);
    }
  } else {
    cb(new Error('Invalid fieldname'), false);
  }
};
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: fileFilter,
});

// @route GET /api/applicants/me - cari iş axtaranın profilini gətirir
router.get('/me', protect, authorize(['applicant']), getApplicantProfile);

// @route PUT /api/applicants/profile - iş axtaranın profilini güncəlləyir
router.put(
  '/profile',
  protect,
  authorize(['applicant']),
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 }
  ]),
  updateApplicantProfile
);

// @desc    Bütün ictimai iş axtaran profillərini almaq
// @route   GET /api/applicants
// @access  Private (Login olan hər kəs)
router.get('/', protect, async (req, res) => {
  try {
    const applicants = await ApplicantProfile.find({ isPublic: true })
      .populate('userId', 'email role')
      .populate('category', 'name');
    res.json(applicants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    ID-yə görə tək ictimai iş axtaran profilini almaq
// @route   GET /api/applicants/:id
// @access  Private (Login olan hər kəs)
router.get('/:id', protect, async (req, res) => {
  if (req.params.id === 'me') {
    return res.status(400).json({ message: 'Invalid profile ID' });
  }
  try {
    const applicantProfile = await ApplicantProfile.findOne({ userId: req.params.id, isPublic: true })
      .populate('userId', 'email role')
      .populate('category', 'name');
    if (!applicantProfile) {
      return res.status(404).json({ message: 'Applicant profile not found or not public' });
    }
    res.json(applicantProfile);
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid profile ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;