const Brand = require('../models/Brand');
const { sendSuccess, sendError } = require('../middleware/response');

// GET /api/brands/my  — get current brand's info
const getMyBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.admin.brandId);
    if (!brand) return sendError(res, 'Brand not found', 404);
    sendSuccess(res, brand);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// PUT /api/brands/my  — update brand info & widget config
const updateMyBrand = async (req, res) => {
  try {
    const { name, website, logo, widgetConfig } = req.body;

    const brand = await Brand.findByIdAndUpdate(
      req.admin.brandId,
      { name, website, logo, widgetConfig },
      { new: true, runValidators: true }
    );

    sendSuccess(res, brand, 'Brand updated');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

module.exports = { getMyBrand, updateMyBrand };