import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import Transaction from '../../../../../models/Transaction';
import Order from '../../../../../models/Order';
import Payout from '../../../../../models/Payout';
import RankApproval from '../../../../../models/RankApproval';
import { verifyToken } from '../../../../../lib/auth';

export async function GET(request) {
  try {
    await dbConnect();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get pending approvals
    const pendingPackages = await Transaction.find({ 
      type: 'package_purchase', 
      status: 'pending' 
    }).populate('userId', 'username phone').sort({ createdAt: -1 });

    const pendingOrders = await Order.find({ status: 'pending' })
      .populate('userId', 'username phone rank')
      .sort({ createdAt: -1 });

    const approvedOrders = await Order.find({ status: 'approved' })
      .populate('userId', 'username phone rank')
      .sort({ createdAt: -1 });

    const pendingPayouts = await Payout.find({ status: 'pending' })
      .populate('userId', 'username phone')
      .populate('sourceUserId', 'username phone')
      .sort({ createdAt: -1 });

    const pendingRankApprovals = await RankApproval.find({ status: 'pending' })
      .populate('userId', 'username phone rank')
      .sort({ createdAt: -1 });

    // Get statistics
    const totalUsers = await User.countDocuments({ isAdmin: { $ne: true } });
    const totalRevenue = await Transaction.aggregate([
      { $match: { type: 'package_purchase', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const rankDistribution = await User.aggregate([
      { $match: { rank: { $ne: null } } },
      { $group: { _id: '$rank', count: { $sum: 1 } } }
    ]);

    // Pending incentives (users whose incentives are pending)
    const pendingIncentives = await User.find({
      $or: [
        { 'incentives.umrahTicket.status': 'pending' },
        { 'incentives.fixedSalary.status': 'pending' },
        { 'incentives.carPlan.status': 'pending' }
      ]
    }).select('username phone rank incentives');

    return NextResponse.json({
      pendingApprovals: {
        packages: pendingPackages,
        orders: pendingOrders,
        payouts: pendingPayouts,
        incentives: pendingIncentives,
        rankApprovals: pendingRankApprovals
      },
      approvedOrders,
      statistics: {
        totalUsers,
        totalRevenue: totalRevenue[0]?.total || 0,
        rankDistribution
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
