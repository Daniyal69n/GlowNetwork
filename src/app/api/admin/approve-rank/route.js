import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import { verifyToken } from '../../../../../lib/auth';
import User from '../../../../../models/User';
import RankApproval from '../../../../../models/RankApproval';

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

    const { approvalId, action, notes } = await request.json();
    if (!approvalId || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const approval = await RankApproval.findById(approvalId);
    if (!approval) {
      return NextResponse.json({ error: 'Approval request not found' }, { status: 404 });
    }
    if (approval.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
    }

    const user = await User.findById(approval.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    approval.status = action;
    approval.approvedBy = decoded.userId === 'admin' ? null : decoded.userId;
    approval.approvedAt = new Date();
    if (notes) approval.notes = notes;

    if (action === 'approved') {
      user.rank = approval.targetRank;
      user.pendingRank = null;
      user.hasPendingRank = false;
      await user.save();
      // Side-effect: after a user's rank is approved, check if their referrer qualifies for an upgrade
      try {
        if (user.referredBy) {
          await checkAndUpgradeReferrer(user.referredBy);
        }
      } catch (e) {
        console.error('Non-fatal: referrer check after rank approval failed:', e);
      }
    } else if (action === 'rejected') {
      user.pendingRank = null;
      user.hasPendingRank = false;
      await user.save();
    }

    await approval.save();

    return NextResponse.json({ message: `Rank ${action} successfully` });
  } catch (error) {
    console.error('Rank approval admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // List pending rank approvals
    const approvals = await RankApproval.find({ status: 'pending' }).sort({ createdAt: -1 });
    return NextResponse.json({ approvals });
  } catch (error) {
    console.error('Rank approval admin list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Local helper to mirror referrer upgrade behavior without changing other modules
async function checkAndUpgradeReferrer(referralCode) {
  const RANK_REQUIREMENTS = {
    'Assistant': { next: 'Manager', requirement: 50000 },
    'Manager': { next: 'S.Manager', requirement: 100000 }
  };

  const referrer = await User.findOne({ referralCode });
  if (!referrer || !referrer.rank) return;

  const directReferrals = await User.find({
    referredBy: referrer.referralCode,
    packagePurchased: { $exists: true, $ne: null }
  });

  let directReferralValue = 0;
  let directSManagerCount = 0;
  for (const referral of directReferrals) {
    if (referral.packagePurchased) directReferralValue += referral.packagePurchased;
    if (referral.rank === 'S.Manager') directSManagerCount++;
  }

  if (referrer.rank === 'Assistant' && directSManagerCount > 0) {
    referrer.rank = 'S.Manager';
    await referrer.save();
  } else if (referrer.rank === 'Manager' && directSManagerCount > 0) {
    referrer.rank = 'S.Manager';
    await referrer.save();
  } else if (referrer.rank === 'Assistant' && directReferralValue >= RANK_REQUIREMENTS['Assistant'].requirement) {
    referrer.rank = 'Manager';
    await referrer.save();
  } else if (referrer.rank === 'Manager' && directReferralValue >= RANK_REQUIREMENTS['Manager'].requirement) {
    referrer.rank = 'S.Manager';
    await referrer.save();
  }

  if (referrer.referredBy) {
    await checkAndUpgradeReferrer(referrer.referredBy);
  }
}


