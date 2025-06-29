// models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Kateqoriya adı mütləqdir'],
    unique: true, // Hər kateqoriya adı unikal olmalıdır
    trim: true,
    maxlength: [50, 'Kateqoriya adı 50 simvoldan çox ola bilməz']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Category', CategorySchema);