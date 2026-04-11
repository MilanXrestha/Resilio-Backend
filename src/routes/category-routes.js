// Category Routes
const express = require('express');
const categoryController = require('../controllers/category-controller');

const router = express.Router();

// Public routes - categories are public
router.get('/', categoryController.getAllCategories);
router.get('/:id/content', categoryController.getCategoryContent);
router.get('/:id', categoryController.getCategoryById);

module.exports = router;
