const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  logo: {
    type: String,        // URL to logo image
    default: null
  },
  website: {
    type: String,
    default: null
  },
  // Embed config — each brand can customize the widget
  widgetConfig: {
    primaryColor: {
      type: String,
      default: '#6B21A8'   // default purple
    },
    welcomeMessage: {
      type: String,
      default: 'Discover your perfect skincare routine'
    },
    disclaimerText: {
      type: String,
      default: 'This is a cosmetic analysis only, not medical advice. Consult a dermatologist for skin concerns.'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true    // adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Brand', brandSchema);