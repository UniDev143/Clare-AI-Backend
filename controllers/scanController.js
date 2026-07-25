const Scan = require('../models/Scan');
const { sendSuccess, sendError } = require('../middleware/response');

// POST /api/scans  — create new scan (called from frontend widget)
// Real AI logic added Day 10 — stub for now
const createScan = async (req, res) => {
  try {
    const { brandId, questionnaire, sessionId } = req.body;

    if (!brandId || !questionnaire) {
      return sendError(res, 'brandId and questionnaire are required');
    }

    // Placeholder — AI analysis plugged in Day 10
    const scan = await Scan.create({
      brandId,
      questionnaire,
      sessionId,
      analysis: {
        skinType: 'normal',
        overallSkinHealth: 0,
        aiSummary: 'Analysis pending'
      },
      recommendations: []
    });

    sendSuccess(res, scan, 'Scan created — analysis pending', 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// GET /api/scans/:id  — get scan results
const getScan = async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id)
      .populate('recommendations.productId');

    if (!scan) return sendError(res, 'Scan not found', 404);
    sendSuccess(res, scan);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// GET /api/scans/analytics/summary  — dashboard analytics (admin only)
const getAnalytics = async (req, res) => {
  try {
    const brandId = req.admin.brandId;

    const totalScans = await Scan.countDocuments({ brandId });

    // Most common skin conditions detected
    const conditionStats = await Scan.aggregate([
      { $match: { brandId } },
      { $group: {
        _id: null,
        avgAcne:        { $avg: '$analysis.conditions.acne.score' },
        avgDarkSpots:   { $avg: '$analysis.conditions.dark_spots.score' },
        avgDarkCircles: { $avg: '$analysis.conditions.dark_circles.score' },
        avgOiliness:    { $avg: '$analysis.conditions.oiliness.score' },
        avgRedness:     { $avg: '$analysis.conditions.redness.score' },
        avgWrinkles:    { $avg: '$analysis.conditions.wrinkles.score' },
      }}
    ]);

    // Scans per day (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentScans = await Scan.countDocuments({
      brandId,
      createdAt: { $gte: sevenDaysAgo }
    });

    sendSuccess(res, {
      totalScans,
      recentScans,
      conditionStats: conditionStats[0] || {}
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

module.exports = { createScan, getScan, getAnalytics };