// controllers/companyController.js
const Company = require('../models/Company');
const User = require('../models/User'); // User modelini də import edin
const asyncHandler = require('../middleware/async'); // Async hata yakalama middleware'i
const path = require('path'); // Fayl yolları ilə işləmək üçün
const multer = require('multer'); // Fayl yükləmə üçün
const { v4: uuidv4 } = require('uuid'); // Unikal fayl adları üçün

// Multer storage konfiqurasiyası
// Yüklənən şirkət loqolarını layihənin kök qovluğundakı 'uploads/companyLogos' qovluğunda saxlayacaq
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Faylların saxlanacağı qovluğu
    // `process.cwd()` Node.js prosesinin cari iş qovluğudur (adətən layihənin kök qovluğu)
    cb(null, path.join(process.cwd(), 'uploads/companyLogos')); // Fayllar kök qovluqdaki uploads/companyLogos'a düşür
  },
  filename: function (req, file, cb) {
    // Yüklənən fayla unikal ad verin
    // Faylın orijinal uzantısını saxlayın (məsələn, .png, .jpg)
    const extname = path.extname(file.originalname);
    cb(null, `${uuidv4()}${extname}`); // Unikal ID + orijinal uzantı
  },
});

// Fayl filtrləmə funksiyası
// Yalnız müəyyən şəkil tiplərinə (JPEG, PNG, GIF) icazə verin
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
    cb(null, true); // Yükləməyə icazə verin
  } else {
    cb(new Error('Yalnız JPEG, PNG və GIF formatlı şəkillərə icazə verilir!'), false); // Yükləməyə icazə verməyin
  }
};

// Multer upload middleware-i
// Maksimum fayl ölçüsü 2 MB olaraq təyin edilib
// 'logo' input sahəsindən gələn tək faylı qəbul edir
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 2 }, // 2 MB
  fileFilter: fileFilter,
}).single('logo'); // HTML formunda input elementinin 'name' attribute-u 'logo' olmalıdır


// @desc    Cari daxil olmuş şirkətin profilini gətir
// @route   GET /api/companies/me
// @access  Private (Yalnız 'company' rolu olan istifadəçilər üçün)
exports.getCompanyProfile = asyncHandler(async (req, res) => {
  // Daxil olmuş istifadəçinin ID-si ilə əlaqəli şirkət profilini tapın
  const company = await Company.findOne({ userId: req.user.id })
    .populate('userId', 'email role'); // İstifadəçinin email və rolunu da gətirin

  // Əgər şirkət profili tapılmasa, 404 xətası qaytarın
  if (!company) {
    return res.status(404).json({ message: 'Şirkət profiliniz tapılmadı.' });
  }

  // Uğurlu cavabı qaytarın
  res.status(200).json({
    success: true,
    data: company
  });
});

// @desc    Cari daxil olmuş şirkətin profilini yenilə
// @route   PUT /api/companies/profile
// @access  Private (Yalnız 'company' rolu olan istifadəçilər üçün)
exports.updateCompanyProfile = asyncHandler(async (req, res, next) => {
  // Multer yükləmə prosesini idarə edin
  upload(req, res, async (err) => {
    // Multer tərəfindən yaranan xətaları yoxlayın (məsələn, fayl ölçüsü, fayl tipi)
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // Bilinməyən digər xətaları idarə edin
      return res.status(400).json({ message: err.message });
    }

    // Sorğu body-dən gələn məlumatları alın
    const {
      companyName,
      industry,
      description,
      address,
      phone,
      website,
      establishedYear
    } = req.body;

    // Yenilənəcək profil sahələrini bir obyektə yığın
    const profileFields = {
      companyName,
      industry,
      description,
      address,
      phone,
      website,
      establishedYear
    };

    // Əgər yeni bir fayl yüklənibsə (Multer tərəfindən 'req.file' olaraq əlavə olunur)
    if (req.file) {
      // Loqo URL-ini yüklənən faylın yolu ilə yeniləyin
      // 'uploads/' qovluğu statik fayl serveri üçün kök kimi təyin edilib
      profileFields.logoUrl = `/uploads/companyLogos/${req.file.filename}`;
    }

    // Daxil olmuş istifadəçinin şirkət profilini tapın
    let companyProfile = await Company.findOne({ userId: req.user.id });

    // Əgər profil mövcud deyilsə (nadir halda qeydiyyatda səhv olarsa)
    if (!companyProfile) {
      // Yeni profil yaradın
      profileFields.userId = req.user.id;
      companyProfile = await Company.create(profileFields);
      // Şirkət adı ilə əsas istifadəçi display adını da güncəlləyin
      await User.findByIdAndUpdate(req.user.id, { displayName: companyName });

    } else {
      // Profil mövcuddursa, yeniləyin
      // Əgər yeni loqo yüklənibsə VƏ əvvəlki loqo placeholder deyilsə, köhnə loqonu silin
      if (req.file && companyProfile.logoUrl && companyProfile.logoUrl !== "https://via.placeholder.com/150") {
        // `companyProfile.logoUrl` `/uploads/companyLogos/filename.jpg` formatında olacaq.
        // `process.cwd()` layihənin kök qovluğunu verir, beləliklə doğru yolu qururuq.
        const oldLogoPath = path.join(process.cwd(), companyProfile.logoUrl); // <-- DÜZƏLDİLMİŞ YOL HESABLAMASI
            
        if (require('fs').existsSync(oldLogoPath)) {
          require('fs').unlinkSync(oldLogoPath); // Köhnə faylı silin
        }
      }

      // Şirkət profilini tapın və yeniləyin
      companyProfile = await Company.findOneAndUpdate(
        { userId: req.user.id },
        { $set: profileFields }, // Yalnız verilən sahələri yeniləyin
        { new: true, runValidators: true } // Yenilənmiş sənədi qaytarın və validasiyaları işə salın
      );

      // Əgər şirkət adı dəyişibsə, istifadəçi display adını da güncəlləyin
      if (companyName) {
          await User.findByIdAndUpdate(req.user.id, { displayName: companyName });
          req.user.displayName = companyName; // `req.user` obyektini də güncəlləyin
      }
    }

    // Auth context-dəki user məlumatlarını yeniləmək üçün
    const updatedUser = await User.findById(req.user.id).select('-password');

  res.status(200).json({
  success: true,
  data: companyProfile, // Yenilənmiş şirkət profili məlumatları
  message: 'Şirkət profili uğurla yeniləndi!',
 user: {
  id: updatedUser._id,
  email: updatedUser.email,
  role: updatedUser.role,
  displayName: updatedUser.displayName || companyProfile.companyName,
  token: req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null
}
});
// .
  });
});

// @desc    Bütün şirkət profillərini al (Admin üçün) - Example, not directly used in this flow
// @route   GET /api/companies/all
// @access  Private (Yalnız Admin)
// exports.getAllCompanies = asyncHandler(async (req, res) => {
//     const companies = await Company.find().populate('userId', 'email role');
//     res.status(200).json({ success: true, count: companies.length, data: companies });
// });
