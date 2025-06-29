const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Şifrə sıfırlama üçün əlavə et

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email mütləqdir'],
    unique: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Zəhmət olmasa etibarlı email daxil edin',
    ],
  },
  password: {
    type: String,
    required: [true, 'Parol mütləqdir'],
    minlength: 6,
    select: false, // Parolu gətirəndə göstərməsin
  },
  role: {
    type: String,
    enum: ['applicant', 'company', 'admin'],
    default: 'applicant',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,      // Şifrə sıfırlama üçün əlavə et
  resetPasswordExpire: Date,       // Şifrə sıfırlama üçün əlavə et
});

// Parolu hash etməzdən əvvəl
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// JWT token əldə etmə metodu
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Daxil edilmiş parolu hash edilmiş parol ilə müqayisə etmək metodu
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Şifrə sıfırlama tokeni yaradan metod
UserSchema.methods.getResetPasswordToken = function () {
  // Random token yaradılır
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Token hash-lənir və user modelinə yazılır
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  // Tokenin vaxtı 10 dəqiqəlik qoyulur
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// APPLICANT üçün VIRTUAL POPULATE əlavə et
UserSchema.virtual('applicantProfile', {
  ref: 'ApplicantProfile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true, // Hər user üçün yalnız bir profil
});

// ŞİRKƏT üçün VIRTUAL POPULATE əlavə et (əgər gələcəkdə lazım olarsa)
UserSchema.virtual('companyProfile', {
  ref: 'Company',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
});

// Virtual sahələri JSON cavablarına daxil et
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);