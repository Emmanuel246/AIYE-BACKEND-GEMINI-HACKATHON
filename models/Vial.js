const mongoose = require('mongoose');

const vialSchema = new mongoose.Schema({
  organId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organ',
    required: true
  },
  transactionRef: {
    type: String,
    required: true,
    unique: true
  },
  amountUSD: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  donorEmail: {
    type: String,
    default: ''
  },
  donorName: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'PENDING'
  },
  flutterwaveData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
vialSchema.index({ organId: 1, status: 1 });
vialSchema.index({ transactionRef: 1 });

module.exports = mongoose.model('Vial', vialSchema);

