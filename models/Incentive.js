import mongoose from 'mongoose';

const IncentiveSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['umrahTicket', 'carPlan', 'monthlySalary'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // For monthly salary - track which month this is for
  month: {
    type: String, // Format: "YYYY-MM"
    required: function() {
      return this.type === 'monthlySalary';
    }
  },
  // For tracking eligibility criteria
  eligibilityData: {
    // For umrahTicket: user rank when applied
    rank: String,
    // For carPlan: number of direct directors when applied
    directDirectors: Number,
    // For monthlySalary: number of direct S.Managers in that month
    directSManagersInMonth: Number
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date,
    default: null
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient queries
IncentiveSchema.index({ userId: 1, type: 1 });
IncentiveSchema.index({ type: 1, month: 1 });
IncentiveSchema.index({ status: 1 });

export default mongoose.models.Incentive || mongoose.model('Incentive', IncentiveSchema);
