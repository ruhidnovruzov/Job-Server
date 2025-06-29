const express = require('express');
const { getCategories, createCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
  .get(getCategories) // Bütün kateqoriyaları gətir (Public)
  .post(protect, authorize(['admin']), createCategory); // Yeni kateqoriya yarat (Yalnız Admin)

router.route('/:id')
  .delete(protect, authorize(['admin']), deleteCategory); // Kateqoriya sil (Yalnız Admin)

module.exports = router;