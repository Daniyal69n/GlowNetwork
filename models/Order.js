import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [{
    productId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  orderDetails: {
    address: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    notes: {
      type: String,
      default: ''
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'dispatched'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
