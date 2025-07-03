const express = require('express');
const { getCategories, createCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
  .get(getCategories)
  .post(protect, authorize(['admin']), createCategory); 

router.route('/:id')
  .delete(protect, authorize(['admin']), deleteCategory);

module.exports = router;