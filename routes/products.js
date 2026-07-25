const express = require('express');
const router = express.Router();
const {
  getProducts, createProduct, updateProduct,
  deleteProduct, getProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

// All product routes require admin login
router.use(protect);

router.get('/',     getProducts);
router.post('/',    createProduct);
router.get('/:id',  getProduct);
router.put('/:id',  updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;