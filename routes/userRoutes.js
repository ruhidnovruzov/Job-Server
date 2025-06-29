// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const ApplicantProfile = require('../models/ApplicantProfile');
const Company = require('../models/Company');
const User = require('../models/User');

// @desc    Get user profile (İstifadəçinin öz profilini almaq)
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profileData;
    if (user.role === 'applicant') {
      profileData = await ApplicantProfile.findOne({ userId: user._id });
    } else if (user.role === 'company') {
      profileData = await Company.findOne({ userId: user._id });
    }

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      profile: profileData || {}
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update user profile (İstifadəçinin öz profilini yeniləmək)
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  const { email, password,
          firstName, lastName, phone, category, yearsOfExperience, education, experience, skills, about,
          companyName, industry, description, address, website, companyPhone, establishedYear
        } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'This email is already in use by another user.' });
      }
      user.email = email;
    }
    if (password) {
      user.password = password;
    }
    await user.save();

    let profile;
    if (user.role === 'applicant') {
      profile = await ApplicantProfile.findOne({ userId: user._id });
      if (profile) {
        profile.firstName = firstName || profile.firstName;
        profile.lastName = lastName || profile.lastName;
        profile.phone = phone || profile.phone;
        profile.category = category || profile.category;
        profile.yearsOfExperience = yearsOfExperience !== undefined ? yearsOfExperience : profile.yearsOfExperience;
        profile.about = about || profile.about;

        if (education !== undefined) profile.education = education;
        if (experience !== undefined) profile.experience = experience;
        if (skills !== undefined) profile.skills = skills;

        await profile.save();
      } else {
        profile = await ApplicantProfile.create({
          userId: user._id, firstName, lastName, phone, category, yearsOfExperience, education, experience, skills, about
        });
      }
    } else if (user.role === 'company') {
      profile = await Company.findOne({ userId: user._id });
      if (profile) {
        profile.companyName = companyName || profile.companyName;
        profile.industry = industry || profile.industry;
        profile.description = description || profile.description;
        profile.address = address || profile.address;
        profile.website = website || profile.website;
        profile.phone = companyPhone || profile.phone;
        profile.establishedYear = establishedYear !== undefined ? establishedYear : profile.establishedYear;

        await profile.save();
      } else {
         profile = await Company.create({
          userId: user._id, companyName, industry, description, address, website, phone: companyPhone, establishedYear
        });
      }
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      profile: profile
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

module.exports = router;