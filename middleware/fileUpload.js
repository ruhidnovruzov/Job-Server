// middleware/fileUpload.js
const multer = require('multer');
const path = require('path');

// Yüklənən faylları saxlamaq üçün storage konfiqurasiyası
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Faylların hara yüklənəcəyini təyin edirik
    // process.cwd() proyektin əsas qovluğudur
    cb(null, path.join(process.cwd(), 'uploads/resumes'));
  },
  filename: (req, file, cb) => {
    // Faylın adını təyin edirik (məsələn: user_id-timestamp.pdf)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname); // Faylın uzantısını alırıq
    // Fayl adını user ID-si ilə birləşdirə bilərsiniz, amma hazırda sadəcə unique ID veririk
    // Əgər req.user.id mövcuddursa: `${req.user.id}-${uniqueSuffix}${ext}`
    cb(null, `resume-${uniqueSuffix}${ext}`);
  },
});

// Fayl filtrləmə funksiyası (yalnız PDF və bənzəri fayllara icazə vermək üçün)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/; // İcazə verilən fayl tipləri (regex)
  const mimeType = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Yalnız PDF, DOC və DOCX fayllarına icazə verilir.'), false);
  }
};

const uploadResume = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB (maksimum fayl ölçüsü)
  },
  fileFilter: fileFilter,
});

module.exports = uploadResume;