const mongoose = require('mongoose');

// These are the exact skin issues our AI detects
// Products get tagged with which issues they target
const SKIN_ISSUES = [
  'acne',
  'dark_spots',
  'dark_circles',
  'oiliness',
  'dryness',
  'redness',
  'wrinkles'
];

const SKIN_TYPES = ['oily', 'dry', 'combination', 'sensitive', 'normal', 'all'];

const SEVERITY_LEVELS = ['mild', 'moderate', 'severe', 'all'];

const productSchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true,
    index: true       // we query by brandId constantly, index it
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  image: {
    type: String,     // product image URL
    default: null
  },
  buyLink: {
    type: String,     // link to purchase page on brand's site
    required: true
  },

  // ── THIS IS THE RECOMMENDATION ENGINE'S FUEL ──────────────
  tags: {
    targetsIssues: {
      type: [String],
      enum: SKIN_ISSUES,
      default: []
      // e.g. ['acne', 'oiliness'] means this product helps with acne AND oily skin
    },
    suitableFor: {
      type: [String],
      enum: SKIN_TYPES,
      default: ['all']
      // e.g. ['oily', 'combination']
    },
    severity: {
      type: [String],
      enum: SEVERITY_LEVELS,
      default: ['all']
      // e.g. ['mild', 'moderate'] — don't recommend for severe cases
    },
    avoidIf: {
      type: [String],
      default: []
      // e.g. ['pregnant', 'retinol_allergy'] — matches questionnaire answers
    }
  },

  // Priority score — brand can manually boost a product
  // Higher = more likely to appear in recommendations
  priorityScore: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index: when recommending, we always filter by brandId + active
productSchema.index({ brandId: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);