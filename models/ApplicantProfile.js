const mongoose = require('mongoose');

const ApplicantProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: [true, 'Ad mütləqdir'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Soyad mütləqdir'],
    trim: true,
  },
  phone: {
    type: String,
    // match validasiyasını silindi
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: [true, 'İş sahəsi (kateqoriya) mütləqdir'],
  },
  yearsOfExperience: {
    type: Number,
    default: 0,
    min: 0,
  },
  about: {
    type: String,
    maxlength: [500, 'Haqqınızda mətn 500 simvoldan çox ola bilməz'],
  },
  education: [
    {
      degree: String,
      major: String,
      fieldOfStudy: String,
      institution: String,
      startYear: Number,
      endYear: Number,
    },
  ],
  experience: [
    {
      jobTitle: String,
      companyName: String,
      startDate: Date,
      endDate: Date,
      isCurrent: {
        type: Boolean,
        default: false,
      },
      description: String,
    },
  ],
  skills: [String],
  resume: String,
  profilePicture: String,
  isPublic: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ApplicantProfileSchema.set('toJSON', { virtuals: true });
ApplicantProfileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ApplicantProfile', ApplicantProfileSchema);