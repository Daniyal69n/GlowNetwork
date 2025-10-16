import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  referralCode: {
    type: String,
    required: true,
    unique: true,
    length: 6
  },
  referredBy: {
    type: String, // referral code of the person who referred this user
    default: null
  },
  rank: {
    type: String,
    enum: ['Assistant', 'Manager', 'S.Manager', 'D.Manager', 'G.Manager', 'Director'],
    default: null
  },
  packagePurchased: {
    type: Number,
    default: null
  },
  packagePurchaseDate: {
    type: Date,
    default: null
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  totalReferralValue: {
    type: Number,
    default: 0
  },
  directReferrals: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    packageValue: Number,
    purchaseDate: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  hasPendingPackage: {
    type: Boolean,
    default: false
  },
  hasPendingOrder: {
    type: Boolean,
    default: false
  },
  pendingRank: {
    type: String,
    enum: ['Assistant', 'Manager', 'S.Manager', 'D.Manager', 'G.Manager', 'Director', null],
    default: null
  },
  hasPendingRank: {
    type: Boolean,
    default: false
  }
  // Note: Incentives are now handled by the separate Incentive model
}, {
  timestamps: true
});

// Generate 6-digit referral code
UserSchema.methods.generateReferralCode = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
