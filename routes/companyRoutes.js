// routes/companyRoutes.js
const express = require('express');
const router = express.Router();
// protect və authorize middleware-lərini import edin
const { protect, authorize } = require('../middleware/authMiddleware'); 

// CompanyController-dan lazımi funksiyaları import edin
const {
  getCompanyProfile,
  updateCompanyProfile,
  // Əgər /api/companies endpoint-i üçün getPublicCompanies funksiyası varsa, onu da import edin
} = require('../controllers/companyController'); // companyController faylının yolunu yoxlayın

const Company = require('../models/Company'); // Company modelini də import edin


// @desc    Cari daxil olmuş şirkətin profilini gətir
// @route   GET /api/companies/me
// @access  Private (Yalnız 'company' rolu)
// Qeyd: Bu route, dinamik '/:id' route-dan əvvəl olmalıdır
router.route('/me').get(protect, authorize(['company']), getCompanyProfile);

// @desc    Cari daxil olmuş şirkətin profilini yenilə
// @route   PUT /api/companies/profile
// @access  Private (Yalnız 'company' rolu)
router.route('/profile').put(protect, authorize(['company']), updateCompanyProfile);


// @desc    Bütün ictimai şirkət profillərini al
// @route   GET /api/companies
// @access  Private (Login olan hər kəs tərəfindən)
router.get('/', protect, async (req, res) => {
  try {
    // Bütün şirkət profillərini gətirin (burada isPublic yoxlaması yoxdur, əgər varsa əlavə edin)
    const companies = await Company.find({})
      .populate('userId', 'email role'); // İstifadəçi məlumatlarını da gətirin

    res.status(200).json({ success: true, count: companies.length, data: companies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server xətası: Şirkət profilləri gətirilə bilmədi.' });
  }
});

// @desc    ID-yə görə tək ictimai şirkət profilini almaq
// @route   GET /api/companies/:id
// @access  Private (Login olan hər kəs tərəfindən)
router.get('/:id', protect, async (req, res) => {
  try {
    // Burada URL parametresi bir ObjectId olaraq qəbul edilir
    const companyProfile = await Company.findById(req.params.id)
      .populate('userId', 'email role');

    if (!companyProfile) {
      return res.status(404).json({ message: 'Şirkət profili tapılmadı.' });
    }

    res.status(200).json({ success: true, data: companyProfile });
  } catch (error) {
    console.error(error);
    // Əgər ID formatı səhvdirsə (məsələn, "me" kimi) CastError verəcək
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Yanlış profil ID formatı.' });
    }
    res.status(500).json({ message: 'Server xətası: Profil gətirilə bilmədi.' });
  }
});


module.exports = router;
