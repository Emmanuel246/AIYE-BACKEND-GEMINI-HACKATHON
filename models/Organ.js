const mongoose = require('mongoose');

const organSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Lungs', 'Veins', 'Skin']
  },
  healthScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 50
  },
  symptomState: {
    type: String,
    required: true,
    enum: ['HEALTHY', 'INFLAMED', 'HEALING'],
    default: 'INFLAMED'
  },
  currentFundingUSD: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  targetFundingUSD: {
    type: Number,
    required: true,
    default: 100000
  },
  lastMetricValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  diagnosis: {
    type: String,
    default: ''
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for funding percentage
organSchema.virtual('fundingPercentage').get(function() {
  if (this.targetFundingUSD === 0) return 0;
  return (this.currentFundingUSD / this.targetFundingUSD) * 100;
});

// Ensure virtuals are included in JSON
organSchema.set('toJSON', { virtuals: true });
organSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Organ', organSchema);

