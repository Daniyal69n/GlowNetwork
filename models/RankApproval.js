import mongoose from 'mongoose';

const RankApprovalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentRank: {
    type: String,
    enum: ['Assistant', 'Manager', 'S.Manager', 'D.Manager', 'G.Manager', 'Director', null],
    default: null
  },
  targetRank: {
    type: String,
    enum: ['Assistant', 'Manager', 'S.Manager', 'D.Manager', 'G.Manager', 'Director'],
    required: true
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
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

RankApprovalSchema.index({ userId: 1, status: 1 });

export default mongoose.models.RankApproval || mongoose.model('RankApproval', RankApprovalSchema);


