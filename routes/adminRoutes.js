const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const ApplicantProfile = require('../models/ApplicantProfile');
const Company = require('../models/Company');

// @desc    Get all users (Bütün istifadəçiləri almaq - yalnız admin)
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, authorize(['admin']), async (req, res) => {
  try {
    const users = await User.find({}).select('-password');

    const usersWithProfiles = await Promise.all(users.map(async (user) => {
      let profileData = {};
      if (user.role === 'applicant') {
        const applicantProfile = await ApplicantProfile.findOne({ userId: user._id });
        if (applicantProfile) {
          profileData = {
            firstName: applicantProfile.firstName,
            lastName: applicantProfile.lastName,
            phone: applicantProfile.phone,
            category: applicantProfile.category,
            yearsOfExperience: applicantProfile.yearsOfExperience,
          };
        }
      } else if (user.role === 'company') {
        const companyProfile = await Company.findOne({ userId: user._id });
        if (companyProfile) {
          profileData = {
            companyName: companyProfile.companyName,
            industry: companyProfile.industry,
            address: companyProfile.address,
            phone: companyProfile.phone,
            website: companyProfile.website,
          };
        }
      }

      return {
        _id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: profileData,
      };
    }));

    res.json(usersWithProfiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users/:id', protect, authorize(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profileData = {};
    if (user.role === 'applicant') {
      const applicantProfile = await ApplicantProfile.findOne({ userId: user._id });
      if (applicantProfile) {
        profileData = applicantProfile;
      }
    } else if (user.role === 'company') {
      const companyProfile = await Company.findOne({ userId: user._id });
      if (companyProfile) {
        profileData = companyProfile;
      }
    }

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: profileData,
    });

  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a user (İstifadəçini silmək - yalnız admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, authorize(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user.role === 'applicant') {
        await ApplicantProfile.deleteOne({ userId: user._id });
      } else if (user.role === 'company') {
        await Company.deleteOne({ userId: user._id });
      }
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'User and associated profile removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;