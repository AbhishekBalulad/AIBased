const mongoose = require('mongoose');

const GovtSchemeSchema = new mongoose.Schema(
  {
    officialSchemeId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Please provide scheme title'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please provide scheme category'],
      enum: ['Agriculture', 'Education', 'Healthcare', 'Housing', 'Employment', 'Women & Child', 'Financial Support', 'General'],
      default: 'General'
    },
    rawDescription: {
      type: String,
      required: [true, 'Please provide original scheme content']
    },
    simplifiedSummary: {
      type: String,
      default: ''
    },
    benefits: [
      {
        type: String
      }
    ],
    eligibilityCriteria: [
      {
        type: String
      }
    ],
    requiredDocuments: [
      {
        type: String
      }
    ],
    applicationProcedure: [
      {
        type: String
      }
    ],
    officialSourceUrl: {
      type: String,
      required: true,
      trim: true
    },
    schemeSourceRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchemeSource',
      required: false
    },
    targetAudience: {
      type: String,
      default: 'All Citizens'
    },
    state: {
      type: String,
      default: 'All India'
    },
    isSimplified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast multi-filter and text search queries
GovtSchemeSchema.index({ title: 'text', rawDescription: 'text', simplifiedSummary: 'text' });
GovtSchemeSchema.index({ category: 1, state: 1 });
GovtSchemeSchema.index({ officialSchemeId: 1 }, { unique: true });

module.exports = mongoose.model('GovtScheme', GovtSchemeSchema);
