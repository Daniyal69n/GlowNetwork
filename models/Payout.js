import mongoose from 'mongoose';

const PayoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['direct_payout', 'passive_income'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  sourceTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  sourceUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  packageAmount: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  level: {
    type: Number,
    default: 1 // 1 for direct, 2+ for passive income levels
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.models.Payout || mongoose.model('Payout', PayoutSchema);
