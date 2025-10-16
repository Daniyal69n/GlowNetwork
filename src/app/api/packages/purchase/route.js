import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import Transaction from '../../../../../models/Transaction';
import Payout from '../../../../../models/Payout';
import { verifyToken } from '../../../../../lib/auth';

const PACKAGE_CONFIG = {
  20000: { rank: 'Assistant', deliveryFee: 1000, payoutPercentage: 30 },
  50000: { rank: 'Manager', deliveryFee: 1500, payoutPercentage: 35 },
  100000: { rank: 'S.Manager', deliveryFee: 2000, payoutPercentage: 40 }
};

export async function POST(request) {
  try {
    await dbConnect();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { packageAmount } = await request.json();

    if (!PACKAGE_CONFIG[packageAmount]) {
      return NextResponse.json({ error: 'Invalid package amount' }, { status: 400 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.packagePurchased || user.hasPendingPackage) {
      return NextResponse.json({ error: 'Package already purchased or pending approval' }, { status: 400 });
    }

    const config = PACKAGE_CONFIG[packageAmount];
    const netAmount = packageAmount - config.deliveryFee;

    // Create transaction
    const transaction = new Transaction({
      userId: user._id,
      type: 'package_purchase',
      amount: packageAmount,
      packageType: packageAmount,
      deliveryFee: config.deliveryFee,
      netAmount,
      description: `Package purchase - ${config.rank}`
    });

    await transaction.save();
    
    // Mark user as having a pending package
    user.hasPendingPackage = true;
    await user.save();

    // Note: Referral processing will be handled when admin approves the package
    // This ensures referrals are only counted for approved packages

    return NextResponse.json({
      message: 'Package purchase request submitted for approval',
      transactionId: transaction._id
    });

  } catch (error) {
    console.error('Package purchase error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processPassiveIncome(referrer, packageAmount, transactionId, sourceUserId) {
  try {
    // Get the user who made the purchase to check their rank
    const purchaser = await User.findById(sourceUserId);
    
    // If the purchaser is Assistant rank, NO passive income is distributed to upline
    if (purchaser && purchaser.rank === 'Assistant') {
      console.log('No passive income distributed - purchaser is Assistant rank');
      return;
    }
    
    // Find referrer's upline chain
    let currentUser = referrer;
    let uplineLevel = 1; // This tracks the position in the upline chain

    while (currentUser.referredBy && uplineLevel <= 5) {
      const uplineUser = await User.findOne({ referralCode: currentUser.referredBy });
      if (!uplineUser || !uplineUser.packagePurchased) break;

      let percentage = 0;
      const uplineUserRank = uplineUser.rank; // Use the upline member's own rank

      // Calculate passive income based on upline member's own rank and their position in chain
      if (uplineUserRank === 'Assistant' || !uplineUserRank) {
        // Assistant gets no passive income
        percentage = 0;
      } else if (uplineUserRank === 'Manager' || uplineUserRank === 'S.Manager') {
        // Manager/S.Manager: 5% for 1st and 2nd direct only
        if (uplineLevel <= 2) percentage = 5;
      } else if (uplineUserRank === 'D.Manager' || uplineUserRank === 'G.Manager' || uplineUserRank === 'Director') {
        // D.Manager/G.Manager/Director: 5% for 1st and 2nd direct, 3% for 3rd, 4th, 5th direct
        if (uplineLevel <= 2) percentage = 5;
        else if (uplineLevel <= 5) percentage = 3;
      }

      if (percentage > 0) {
        const passiveAmount = Math.floor(packageAmount * (percentage / 100));
        
        const passiveIncome = new Payout({
          userId: uplineUser._id,
          type: 'passive_income',
          amount: passiveAmount,
          sourceTransactionId: transactionId,
          sourceUserId: sourceUserId,
          packageAmount: packageAmount,
          percentage: percentage,
          level: uplineLevel
        });

        await passiveIncome.save();
      }

      currentUser = uplineUser;
      uplineLevel++;
    }
  } catch (error) {
    console.error('Passive income processing error:', error);
  }
}
