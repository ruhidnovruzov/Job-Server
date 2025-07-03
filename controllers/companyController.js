// controllers/companyController.js
const Company = require('../models/Company');
const User = require('../models/User'); // User modelini də import edin
const asyncHandler = require('../middleware/async'); // Async hata yakalama middleware'i
const path = require('path'); // Fayl yolları ilə işləmək üçün
const multer = require('multer'); // Fayl yükləmə üçün
const { v4: uuidv4 } = require('uuid'); // Unikal fayl adları üçün

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads/companyLogos')); 
  },
  filename: function (req, file, cb) {
    const extname = path.extname(file.originalname); // <== BU LİNE ƏLAVƏ OLUNMALI İDİ
    cb(null, `${uuidv4()}${extname}`);
  },
});


const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
    cb(null, true); // Yükləməyə icazə verin
  } else {
    cb(new Error('Yalnız JPEG, PNG və GIF formatlı şəkillərə icazə verilir!'), false); // Yükləməyə icazə verməyin
  }
};


const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 2 }, // 2 MB
  fileFilter: fileFilter,
}).single('logo'); // HTML formunda input elementinin 'name' attribute-u 'logo' olmalıdır


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

    if (req.file) {

      profileFields.logoUrl = `/uploads/companyLogos/${req.file.filename}`;
    }

    let companyProfile = await Company.findOne({ userId: req.user.id });

    if (!companyProfile) {
      // Yeni profil
      profileFields.userId = req.user.id;
      companyProfile = await Company.create(profileFields);
      // Şirkət adı ilə əsas istifadəçi display adını da güncəlləyin
      await User.findByIdAndUpdate(req.user.id, { displayName: companyName });

    } else {

      if (req.file && companyProfile.logoUrl && companyProfile.logoUrl !== "https://via.placeholder.com/150") {

        const oldLogoPath = path.join(process.cwd(), companyProfile.logoUrl); 
            
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

