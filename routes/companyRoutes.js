// routes/companyRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware'); 

const {
  getCompanyProfile,
  updateCompanyProfile,
} = require('../controllers/companyController');

const Company = require('../models/Company'); 



router.route('/me').get(protect, authorize(['company']), getCompanyProfile);


router.route('/profile').put(protect, authorize(['company']), updateCompanyProfile);


router.get('/', protect, async (req, res) => {
  try {
    const companies = await Company.find({})
      .populate('userId', 'email role');

    res.status(200).json({ success: true, count: companies.length, data: companies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server xətası: Şirkət profilləri gətirilə bilmədi.' });
  }
});


router.get('/:id', protect, async (req, res) => {
  try {
    const companyProfile = await Company.findById(req.params.id)
      .populate('userId', 'email role');

    if (!companyProfile) {
      return res.status(404).json({ message: 'Şirkət profili tapılmadı.' });
    }

    res.status(200).json({ success: true, data: companyProfile });
  } catch (error) {
    console.error(error);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Yanlış profil ID formatı.' });
    }
    res.status(500).json({ message: 'Server xətası: Profil gətirilə bilmədi.' });
  }
});


module.exports = router;
