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
    // Check if referrer has a rank that generates passive income
    // If referrer is Assistant, no passive income is generated for the upline
    if (referrer.rank === 'Assistant' || !referrer.rank) {
      return;
    }
    
    // Find referrer's upline chain
    let currentUser = referrer;
    let uplineLevel = 1; // This tracks the position in the upline chain

    while (currentUser.referredBy && uplineLevel <= 5) {
      const uplineUser = await User.findOne({ referralCode: currentUser.referredBy });
      if (!uplineUser || !uplineUser.packagePurchased) break;

      let percentage = 0;
      const referrerRank = referrer.rank; // The rank of the package buyer's referrer determines payout structure

      // Calculate passive income based on referrer's rank and upline position
      if (referrerRank === 'Manager' || referrerRank === 'S.Manager') {
        // Only first 2 upline levels get 5%
        if (uplineLevel <= 2) percentage = 5;
      } else if (referrerRank === 'D.Manager' || referrerRank === 'G.Manager' || referrerRank === 'Director') {
        // First 2 upline levels get 5%, next 3 levels get 3%
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
