const Scan = require('../models/Scan');
const { sendSuccess, sendError } = require('../middleware/response');
const { analyseSkinWithRetry } = require('../services/skinAnalysisService');
const { REJECTION_MESSAGES }   = require('../prompts/rejectionMessages');

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


// POST /api/scans/upload-image
// Receives base64 image, processes it, deletes immediately

// POST /api/scans/upload-image
const uploadImage = async (req, res) => {
  let imageBuffer = null;

  try {
    const { imageData, mimeType, brandId, sessionId, qualityScore } = req.body;

    if (!imageData || !brandId) {
      return sendError(res, 'imageData and brandId are required');
    }

    // Validate brand exists
    const Brand = require('../models/Brand');
    const brand = await Brand.findById(brandId);
    if (!brand) return sendError(res, 'Brand not found', 404);

    // Convert and validate image
    imageBuffer = Buffer.from(imageData, 'base64');

    const isJpeg = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8;
    const isPng  = imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50;
    if (!isJpeg && !isPng) {
      return sendError(res, 'Invalid image format — JPEG or PNG only');
    }

    const maxSize = 5 * 1024 * 1024;   // 5MB
    if (imageBuffer.length > maxSize) {
      return sendError(res, 'Image too large — maximum 5MB');
    }

    // ── CREATE INITIAL SCAN ────────────────────────────
    const scan = await Scan.create({
      brandId,
      sessionId: sessionId || `auto_${Date.now()}`,
      imageQualityScore: qualityScore || 0,
      questionnaire: {
        skinSensitivity: 'not_sensitive',   // questionnaire filled Day 11
        currentRoutine:  'none',
        budget:          'medium',
        primaryConcern:  'general',
      },
      analysis: {
        skinType:          'normal',
        overallSkinHealth: 0,
        aiSummary:         'Analysing...',
        rejected:          false,
      },
      recommendations: []
    });

    // ── CALL AI ANALYSIS ───────────────────────────────
    console.log(`[Upload] Starting analysis for scan ${scan._id}`);

    let analysisResult;
    try {
      analysisResult = await analyseSkinWithRetry(
        imageData,
        mimeType || 'image/jpeg',
        null   // questionnaire passed in Day 11
      );
    } catch (aiError) {
      // AI call failed entirely — mark scan and return error
      await Scan.findByIdAndUpdate(scan._id, {
        'analysis.aiSummary':  'Analysis failed — please try again',
        'analysis.confidence': 'low'
      });
      return sendError(res, `Analysis failed: ${aiError.message}`, 500);
    }

    // ── IMAGE DELETED HERE ─────────────────────────────
    imageBuffer = null;

    // ── HANDLE REJECTION ──────────────────────────────
    if (analysisResult.rejected) {
      const reason  = analysisResult.rejectionReason || 'poor_quality';
      const message = REJECTION_MESSAGES[reason] || REJECTION_MESSAGES.poor_quality;

      await Scan.findByIdAndUpdate(scan._id, {
        'analysis.rejected':       true,
        'analysis.rejectionReason': reason,
        'analysis.aiSummary':       message,
        'analysis.overallSkinHealth': 0,
      });

      return sendSuccess(res, {
        scanId:    scan._id,
        rejected:  true,
        reason,
        message,
      }, 'Image rejected', 200);
    }

    // ── SAVE REAL ANALYSIS ─────────────────────────────
    const { data } = analysisResult;

    await Scan.findByIdAndUpdate(scan._id, {
      'analysis.skinType':          data.skinType,
      'analysis.conditions':        data.conditions,
      'analysis.overallSkinHealth': data.overallSkinHealth,
      'analysis.aiSummary':         data.aiSummary,
      'analysis.confidence':        data.confidence,
      'analysis.rejected':          false,
    });

    console.log(`[Upload] Analysis complete for scan ${scan._id} — health: ${data.overallSkinHealth}`);

    sendSuccess(res, {
      scanId:            scan._id,
      rejected:          false,
      overallSkinHealth: data.overallSkinHealth,
      skinType:          data.skinType,
      confidence:        data.confidence,
    }, 'Analysis complete', 201);

  } catch (error) {
    imageBuffer = null;
    console.error('[Upload] Unexpected error:', error.message);
    sendError(res, error.message, 500);
  }
};

module.exports = { createScan, getScan, getAnalytics, uploadImage };