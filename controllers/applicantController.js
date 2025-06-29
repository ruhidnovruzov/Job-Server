const ApplicantProfile = require('../models/ApplicantProfile');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');

// @desc    İş axtaranın profilini güncəlləmək
// @route   PUT /api/applicants/profile
// @access  Private (yalnız iş axtaran)
exports.updateApplicantProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, category, yearsOfExperience, about, skills, education, experience } = req.body;

  const profileFields = {
    firstName,
    lastName,
    phone,
    category,
    yearsOfExperience,
    about,
  };

  // Parse JSON strings for complex fields
  if (skills) {
    try {
      profileFields.skills = typeof skills === 'string' ? JSON.parse(skills) : skills;
    } catch (error) {
      profileFields.skills = Array.isArray(skills) ? skills : skills.split(',').map(skill => skill.trim());
    }
  }

  if (education) {
    try {
      profileFields.education = typeof education === 'string' ? JSON.parse(education) : education;
    } catch (error) {
      profileFields.education = [];
    }
  }

  if (experience) {
    try {
      profileFields.experience = typeof experience === 'string' ? JSON.parse(experience) : experience;
    } catch (error) {
      profileFields.experience = [];
    }
  }

  let applicantProfile = await ApplicantProfile.findOne({ userId: req.user.id });

  if (!applicantProfile) {
    return res.status(404).json({ message: 'Profil tapılmadı. Zəhmət olmasa qeydiyyat zamanı məlumatları düzgün daxil edin.' });
  }

  // Fayllar yüklənibsə, yolları yenilə
  if (req.files && req.files['resume']) {
    profileFields.resume = `/uploads/resumes/${req.files['resume'][0].filename}`;
  }
  if (req.files && req.files['profilePicture']) {
    profileFields.profilePicture = `/uploads/profilePictures/${req.files['profilePicture'][0].filename}`;
  }

  applicantProfile = await ApplicantProfile.findOneAndUpdate(
    { userId: req.user.id },
    { $set: profileFields },
    { new: true, runValidators: true }
  ).populate('category', 'name');

  res.status(200).json({
    success: true,
    data: applicantProfile,
    message: 'Profil uğurla yeniləndi!'
  });
});

// @desc    İş axtaranın profilini almaq (öz profili)
// @route   GET /api/applicants/me
// @access  Private (yalnız iş axtaran)
exports.getApplicantProfile = asyncHandler(async (req, res) => {
  const applicantProfile = await ApplicantProfile.findOne({ userId: req.user.id })
    .populate('userId', 'email')
    .populate('category', 'name');

  if (!applicantProfile) {
    return res.status(404).json({ message: 'İş axtaran profili tapılmadı.' });
  }

  res.status(200).json({
    success: true,
    data: applicantProfile
  });
});

// @desc    Bütün ictimai namizəd profillərini almaq
// @route   GET /api/applicants
// @access  Private (daxil olmuş istifadəçilər)
exports.getPublicApplicants = asyncHandler(async (req, res) => {
  const applicants = await ApplicantProfile.find({ isPublic: true })
    .populate('userId', 'email')
    .populate('category', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json(applicants);
});

// @desc    Müəyyən namizədin profilini almaq
// @route   GET /api/applicants/:id
// @access  Private (daxil olmuş istifadəçilər)
exports.getApplicantById = asyncHandler(async (req, res) => {
  const applicant = await ApplicantProfile.findOne({ 
    userId: req.params.id, 
    isPublic: true 
  })
    .populate('userId', 'email')
    .populate('category', 'name');

  if (!applicant) {
    return res.status(404).json({ message: 'Namizəd profili tapılmadı və ya ictimai deyil.' });
  }

  res.status(200).json(applicant);
});