const mongoose = require('mongoose');

const JobListingSchema = new mongoose.Schema(
  {
    externalJobId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Please provide job title'],
      trim: true
    },
    companyName: {
      type: String,
      required: [true, 'Please provide company name'],
      trim: true
    },
    location: {
      type: String,
      default: 'Multiple Locations / Remote'
    },
    salaryRange: {
      type: String,
      default: 'Not Specified'
    },
    jobType: {
      type: String,
      enum: ['Full-Time', 'Part-Time', 'Contract', 'Government', 'Internship'],
      default: 'Full-Time'
    },
    description: {
      type: String,
      required: [true, 'Please provide job description']
    },
    requirements: [
      {
        type: String
      }
    ],
    officialApplyUrl: {
      type: String,
      required: true,
      trim: true
    },
    contactEmail: {
      type: String,
      trim: true,
      default: ''
    },
    jobSourceRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobSource',
      required: false
    },

    // AI Fraud Risk Analysis Fields
    fraudRiskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 10
    },
    riskLevel: {
      type: String,
      enum: ['Low Risk', 'Medium Risk', 'High Risk'],
      default: 'Low Risk'
    },
    suspiciousIndicators: [
      {
        type: String
      }
    ],
    riskExplanation: {
      type: String,
      default: 'Verified listing from official source feed.'
    },
    safetyWarnings: [
      {
        type: String
      }
    ]
  },
  {
    timestamps: true
  }
);

JobListingSchema.index({ title: 'text', companyName: 'text', description: 'text' });
JobListingSchema.index({ riskLevel: 1 });
JobListingSchema.index({ externalJobId: 1 }, { unique: true });

module.exports = mongoose.model('JobListing', JobListingSchema);
