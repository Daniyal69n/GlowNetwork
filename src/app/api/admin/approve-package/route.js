import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import Transaction from '../../../../../models/Transaction';
import Payout from '../../../../../models/Payout';
import { verifyToken } from '../../../../../lib/auth';

const PACKAGE_CONFIG = {
  20000: { rank: 'Assistant', deliveryFee: 1000 },
  50000: { rank: 'Manager', deliveryFee: 1500 },
  100000: { rank: 'S.Manager', deliveryFee: 2000 }
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
    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { transactionId, packageId, action } = await request.json();
    const actualTransactionId = transactionId || packageId; // Accept either parameter name

    const transaction = await Transaction.findById(actualTransactionId);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status !== 'pending') {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    transaction.status = action;
    transaction.approvedBy = decoded.userId === 'admin' ? null : decoded.userId;
    transaction.approvedAt = new Date();

    // Get the user regardless of approval or rejection
    const user = await User.findById(transaction.userId);
    if (user) {
      // Reset the pending package flag in all cases
      user.hasPendingPackage = false;
      
      if (action === 'approved') {
        // Update user's package and rank
        const config = PACKAGE_CONFIG[transaction.packageType];
        user.packagePurchased = transaction.packageType;
        user.rank = config.rank;
        user.packagePurchaseDate = new Date();
      }
      
      await user.save();

        // Process referral benefits when package is approved
        if (action === 'approved') {
          try {
            if (user.referredBy) {
              const referrer = await User.findOne({ referralCode: user.referredBy });
              if (referrer) {
                // Add direct referral entry
                if (!Array.isArray(referrer.directReferrals)) {
                  referrer.directReferrals = [];
                }
                const alreadyRecorded = referrer.directReferrals.some(r => String(r.userId) === String(user._id));
                if (!alreadyRecorded) {
                  referrer.directReferrals.push({
                    userId: user._id,
                    packageValue: transaction.packageType,
                    purchaseDate: new Date()
                  });
                  referrer.totalReferralValue += transaction.packageType;
                  await referrer.save();
                }

                // Award direct payout only if referrer has an active package
                if (referrer.packagePurchased) {
                  const DELIVERY_FEES = { 20000: 1000, 50000: 1500, 100000: 2000 };
                  const PAYOUT_PERCENTAGES = { 20000: 30, 50000: 35, 100000: 40 };
                  const netAmount = transaction.packageType - DELIVERY_FEES[transaction.packageType];
                  const payoutPercentage = PAYOUT_PERCENTAGES[transaction.packageType];
                  const payoutAmount = Math.floor(netAmount * (payoutPercentage / 100));
                  
                  const directPayout = new Payout({
                    userId: referrer._id,
                    type: 'direct_payout',
                    amount: payoutAmount,
                    sourceTransactionId: transaction._id,
                    sourceUserId: user._id,
                    packageAmount: netAmount,
                    percentage: payoutPercentage,
                    level: 1
                  });
                  await directPayout.save();

                  // Process passive income for upline
                  await processPassiveIncome(referrer, netAmount, transaction._id, user._id);
                }
              }
            }
          } catch (referralError) {
            console.error('Admin approve referral processing error (non-fatal):', referralError);
          }
        }
    } else {
      console.error('User not found for transaction:', transaction.userId);
    }

    await transaction.save();

    return NextResponse.json({
      message: `Package ${action} successfully`
    });

  } catch (error) {
    console.error('Package approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processPassiveIncome(referrer, packageAmount, transactionId, sourceUserId) {
  try {
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
