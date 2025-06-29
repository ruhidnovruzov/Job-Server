// models/Company.js
const mongoose = require('mongoose');

const companySchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  industry: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  address: {
    type: String,
    required: true
  },
  website: {
    type: String,
    match: [
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
      'Please enter a valid website URL'
    ]
  },
  phone: {
    type: String
  },
  logoUrl: {
    type: String,
    default: 'https://via.placeholder.com/150' // Varsayılan loqo URL-i
  },
  establishedYear: {
    type: Number
  }
}, {
  timestamps: true
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;