const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'İş elanının adı mütləqdir.'],
    trim: true,
    maxlength: [100, 'İş elanının adı 100 simvoldan çox ola bilməz.']
  },
  description: {
    type: String,
    required: [true, 'İş elanının təsviri mütləqdir.'],
    minlength: [50, 'İş elanının təsviri ən az 50 simvol olmalıdır.']
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: true
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: true
  },
  location: {
    type: String,
    required: [true, 'İş yeri mütləqdir.']
  },
  salaryRange: {
    type: String,
    enum: ['1-500 AZN', '501-1000 AZN', '1001-2000 AZN', '2001-3000 AZN', 'Müzakirə yolu ilə', '3000+ AZN'],
    default: 'Müzakirə yolu ilə',
  },
  jobType: {
    type: String,
    enum: ['Tam İş Günü', 'Yarım İş Günü', 'Freelance', 'Müvəqqəti', 'Praktika'],
    default: 'Tam İş Günü'
  },
  experienceLevel: {
    type: String,
    enum: ['Təcrübəsiz', 'Junior', 'Mid-Level', 'Senior', 'Lead'],
    default: 'Təcrübəsiz'
  },
  applicationDeadline: {
    type: Date,
    required: [true, 'Müraciət son tarixi mütləqdir.']
  },
  applicants: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
      },
      resume: String, 
      appliedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

JobSchema.virtual('companyName', {
  ref: 'Company',
  localField: 'company',
  foreignField: '_id',
  justOne: true,
  options: { select: 'companyName' }
});

JobSchema.virtual('categoryName', {
  ref: 'Category',
  localField: 'category',
  foreignField: '_id',
  justOne: true,
  options: { select: 'name' }
});

JobSchema.set('toJSON', { virtuals: true });
JobSchema.set('toObject', { virtuals: true });

JobSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'company',
    select: 'companyName industry logoUrl' 
  }).populate({
    path: 'category',
    select: 'name'
  });
  next();
});

module.exports = mongoose.model('Job', JobSchema);