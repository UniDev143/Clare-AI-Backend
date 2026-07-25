const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../middleware/response');

// GET /api/products  — get all products for this brand
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({
      brandId: req.admin.brandId,
      isActive: true
    }).sort({ priorityScore: -1, createdAt: -1 });

    sendSuccess(res, products);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// POST /api/products  — add a new product
const createProduct = async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      brandId: req.admin.brandId    // always use authenticated brand's id
    });
    sendSuccess(res, product, 'Product created', 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// PUT /api/products/:id  — update a product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, brandId: req.admin.brandId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return sendError(res, 'Product not found', 404);
    sendSuccess(res, product, 'Product updated');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// DELETE /api/products/:id  — soft delete
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, brandId: req.admin.brandId },
      { isActive: false },
      { new: true }
    );
    if (!product) return sendError(res, 'Product not found', 404);
    sendSuccess(res, null, 'Product deleted');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// GET /api/products/:id  — get single product
const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      brandId: req.admin.brandId
    });
    if (!product) return sendError(res, 'Product not found', 404);
    sendSuccess(res, product);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct, getProduct };