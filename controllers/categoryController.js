// controllers/categoryController.js
const Category = require('../models/Category');
const asyncHandler = require('../middleware/async'); // Əgər asyncHandler istifadə edirsinizsə

// @desc    Bütün kateqoriyaları gətir
// @route   GET /api/categories
// @access  Public (hər kəs görə bilər)
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('name'); // Adına görə sırala
  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Yeni kateqoriya yarat
// @route   POST /api/categories
// @access  Private (yalnız admin)
exports.createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  // Kateqoriya adının boş olub-olmadığını yoxla
  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Kateqoriya adı boş ola bilməz.' });
  }

  // Adı kiçik hərflərə çevirib yadda saxla
  const category = await Category.create({ name: name.trim() });

  res.status(201).json({
    success: true,
    data: category
  });
});

// @desc    Kateqoriyanı ID-yə görə sil (əlavə olaraq)
// @route   DELETE /api/categories/:id
// @access  Private (yalnız admin)
exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ success: false, message: `ID-si ${req.params.id} olan kateqoriya tapılmadı.` });
  }

  await category.deleteOne(); // Mongoose 6+ üçün remove() əvəzinə deleteOne() istifadə olunur

  res.status(200).json({
    success: true,
    data: {}
  });
});