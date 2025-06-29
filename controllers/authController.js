const User = require('../models/User');
const ApplicantProfile = require('../models/ApplicantProfile');
const Company = require('../models/Company');
const Category = require('../models/Category');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const dotenv = require('dotenv');
dotenv.config();

// JWT token yaratmaq üçün köməkçi funksiya
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// @desc    İstifadəçi qeydiyyatı
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const {
    email,
    password,
    role,
    firstName, lastName, phone, category, yearsOfExperience, education, experience, skills, about,
    companyName, industry, description, address, website, companyPhone, establishedYear
  } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: 'Bu email ilə istifadəçi artıq mövcuddur.' });
    }

    user = await User.create({
      email,
      password,
      role: role || 'applicant',
    });

    if (user) {
      if (user.role === 'applicant') {
        // Kateqoriyanın mövcudluğunu yoxlayın
        const existingCategory = await Category.findById(category);
        if (!existingCategory) {
          await User.findByIdAndDelete(user._id);
          return res.status(400).json({ message: 'Seçilmiş kateqoriya mövcud deyil.' });
        }

        const applicantProfile = await ApplicantProfile.create({
          userId: user._id,
          firstName,
          lastName,
          phone,
          category,
          yearsOfExperience,
          education: education || [],
          experience: experience || [],
          skills: skills || [],
          about,
          isPublic: true
        });
        if (!applicantProfile) {
          await User.findByIdAndDelete(user._id);
          return res.status(400).json({ message: 'İş axtaran profili yaradıla bilmədi.' });
        }
      } else if (user.role === 'company') {
        const companyProfile = await Company.create({
          userId: user._id,
          companyName,
          industry,
          description,
          address,
          website,
          phone: companyPhone,
          establishedYear
        });
        if (!companyProfile) {
          await User.findByIdAndDelete(user._id);
          return res.status(400).json({ message: 'Şirkət profili yaradıla bilmədi.' });
        }
      }

      res.status(201).json({
        _id: user._id,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        message: 'İstifadəçi uğurla qeydiyyatdan keçdi və profil yaradıldı.'
      });
    } else {
      res.status(400).json({ message: 'Yanlış istifadəçi məlumatı.' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Qeydiyyat zamanı server xətası.' });
  }
};

// @desc    İstifadəçi girişi
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password'); 

    if (!user) {
      return res.status(400).json({ message: 'Yanlış Email və ya Parol.' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Yanlış Email və ya Parol.' });
    }

    const token = generateToken(user._id);

    // İstifadəçinin roluna görə ad/soyad və ya şirkət adını tapırıq
    let displayName = user.email;

    if (user.role === 'applicant') {
      const applicantProfile = await ApplicantProfile.findOne({ userId: user._id });
      if (applicantProfile && applicantProfile.firstName && applicantProfile.lastName) {
        displayName = `${applicantProfile.firstName} ${applicantProfile.lastName}`;
      }
    } else if (user.role === 'company') {
      const companyProfile = await Company.findOne({ userId: user._id });
      if (companyProfile && companyProfile.companyName) {
        displayName = companyProfile.companyName;
      }
    } else if (user.role === 'admin') {
      displayName = "Admin";
    }

    res.status(200).json({
      success: true,
      token,
      role: user.role,
      displayName,
      message: 'Uğurla giriş edildi!'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server xətası' });
  }
};

// @desc    Şifrəni unutdum
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Bu email ünvanı ilə istifadəçi tapılmadı.'
      });
    }

    // Reset token yaradın
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Reset URL yaradın
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Email mətnini yaradın
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333; text-align: center;">Şifrə Sıfırlama Tələbi</h2>
        <p>Salam,</p>
        <p>Sizin hesabınız üçün şifrə sıfırlama tələbi alınmışdır.</p>
        <p>Şifrənizi sıfırlamaq üçün aşağıdakı düyməyə klikləyin:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Şifrəni Sıfırla
          </a>
        </div>
        <p>Əgər düymə işləməzsə, aşağıdakı linki kopyalayıb brauzerinizə yapışdırın:</p>
        <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
        <p><strong>Diqqət:</strong> Bu link yalnız 10 dəqiqə müddətində keçərlidir.</p>
        <p>Əgər bu tələbi siz etməmisinizsə, bu emailı nəzərə almayın.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px; text-align: center;">
          Job Board Platforması<br>
          Bu avtomatik göndərilən emaildir, cavab verməyin.
        </p>
      </div>
    `;

    try {
      const emailResult = await sendEmail({
        email: user.email,
        subject: 'Şifrə Sıfırlama Tələbi',
        html
      });

      if (emailResult.success) {
        res.status(200).json({
          success: true,
          message: 'Şifrə sıfırlama linki email ünvanınıza göndərildi.'
        });
      } else {
        // Email göndərilmədisə, token-i təmizləyin
        user.resetPasswordToken = undefined;  
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).json({
          success: false,
          message: 'Email göndərilə bilmədi. Zəhmət olmasa yenidən cəhd edin.'
        });
      }
    } catch (error) {
      console.error('Email göndərmə xətası:', error);
      
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email göndərilə bilmədi. Zəhmət olmasa yenidən cəhd edin.'
      });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server xətası baş verdi.'
    });
  }
};

// @desc    Şifrəni sıfırla
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
  const { password } = req.body;

  try {
    // Reset token-i hash edin
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    // Token-i və müddətini yoxlayın
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Yanlış və ya vaxtı keçmiş token.'
      });
    }

    // Yeni şifrəni təyin edin
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    // Yeni token yaradın
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      message: 'Şifrə uğurla yeniləndi.'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server xətası baş verdi.'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
};