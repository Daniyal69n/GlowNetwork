import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import { verifyToken } from '../../../../../lib/auth';
import RankApproval from '../../../../../models/RankApproval';

const RANK_REQUIREMENTS = {
  'Assistant': {
    next: 'Manager',
    requirement: 50000 // ₨50k referral value
  },
  'Manager': {
    next: 'S.Manager',
    requirement: 100000 // ₨100k referral value
  },
  'S.Manager': {
    next: 'D.Manager',
    teamRequirement: { rank: 'S.Manager', count: 5 } // Only 5 S.Managers in downline
  },
  'D.Manager': {
    next: 'G.Manager',
    teamRequirement: { rank: 'D.Manager', count: 5 } // Only 5 D.Managers in downline
  },
  'G.Manager': {
    next: 'Director',
    teamRequirement: { rank: 'G.Manager', count: 4 } // Only 4 G.Managers in downline
  }
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

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // If user doesn't have a rank yet but has purchased a package, assign Assistant rank
    if (!user.rank && user.packagePurchased) {
      user.rank = 'Assistant';
      await user.save();
    }
    
    if (!user.rank) {
      return NextResponse.json({ error: 'No rank assigned' }, { status: 404 });
    }

    const currentRank = user.rank;
    const rankConfig = RANK_REQUIREMENTS[currentRank];

    if (!rankConfig) {
      return NextResponse.json({ error: 'Maximum rank reached' }, { status: 400 });
    }

    // Check only direct referrals for rank upgrade
    // Get all direct referrals with approved packages
    const directReferrals = await User.find({ 
      referredBy: user.referralCode,
      packagePurchased: { $exists: true, $ne: null }
    });
    
    console.log(`Found ${directReferrals.length} direct referrals for user ${user.username}`);
    
    // Calculate total value from direct referrals only
    let directReferralValue = 0;
    let directSManagerCount = 0;
    
    for (const referral of directReferrals) {
      if (referral.packagePurchased) {
        directReferralValue += referral.packagePurchased;
        console.log(`Direct referral ${referral.username} has package value: ${referral.packagePurchased}`);
      }
      
      if (referral.rank === 'S.Manager') {
        directSManagerCount++;
        console.log(`Direct referral ${referral.username} is an S.Manager`);
      }
    }
    
    console.log(`Total direct referral value for ${user.username}: ${directReferralValue}`);
    
    // Update user's total referral value
    user.totalReferralValue = directReferralValue;
    await user.save();
    
    // Special case: If user is Assistant and has a direct S.Manager referral
    if (user.rank === 'Assistant' && directSManagerCount > 0) {
      const targetRank = 'S.Manager';
      if (user.hasPendingRank && user.pendingRank === targetRank) {
        return NextResponse.json({ message: 'Rank approval pending. Waiting for admin approval.', pending: true, targetRank });
      }

      // Create rank approval request
      await RankApproval.create({
        userId: user._id,
        currentRank: user.rank,
        targetRank
      });

      user.pendingRank = targetRank;
      user.hasPendingRank = true;
      await user.save();

      return NextResponse.json({ message: 'Rank approval requested. Waiting for admin approval.', pending: true, targetRank });
    }
    
    // Special case: If user is Manager and has a direct S.Manager referral
    if (user.rank === 'Manager' && directSManagerCount > 0) {
      const targetRank = 'S.Manager';
      if (user.hasPendingRank && user.pendingRank === targetRank) {
        return NextResponse.json({ message: 'Rank approval pending. Waiting for admin approval.', pending: true, targetRank });
      }

      await RankApproval.create({
        userId: user._id,
        currentRank: user.rank,
        targetRank
      });

      user.pendingRank = targetRank;
      user.hasPendingRank = true;
      await user.save();

      return NextResponse.json({ message: 'Rank approval requested. Waiting for admin approval.', pending: true, targetRank });
    }
    
    // Check if direct referral value meets requirement for rank upgrade
    const currentReferralValue = directReferralValue;

    if (rankConfig.requirement && currentReferralValue < rankConfig.requirement) {
      console.log('Rank upgrade blocked:', {
        currentRank: user.rank,
        targetRank: rankConfig.next,
        required: rankConfig.requirement,
        currentValue: currentReferralValue,
        totalReferralValue: user.totalReferralValue,
        directReferrals: user.directReferrals?.length || 0,
        directReferralsSum: (user.directReferrals || []).reduce((sum, r) => sum + (r.packageValue || 0), 0)
      });
      return NextResponse.json({
        error: `Insufficient referral value. Required: ₨${rankConfig.requirement.toLocaleString()}, Current: ₨${currentReferralValue.toLocaleString()}`
      }, { status: 400 });
    }

    // Check team requirement for higher ranks (DIRECT REFERRALS ONLY)
    if (rankConfig.teamRequirement) {
      const directTeamCount = await countDirectTeamMembers(user.referralCode, rankConfig.teamRequirement.rank);
      console.log(`Rank upgrade check for ${user.username}:`, {
        currentRank: user.rank,
        targetRank: rankConfig.next,
        requiredTeamRank: rankConfig.teamRequirement.rank,
        requiredCount: rankConfig.teamRequirement.count,
        actualDirectCount: directTeamCount,
        userReferralCode: user.referralCode
      });
      
      if (directTeamCount < rankConfig.teamRequirement.count) {
        return NextResponse.json({
          error: `Insufficient direct team members. Required: ${rankConfig.teamRequirement.count} direct ${rankConfig.teamRequirement.rank}s, Current: ${directTeamCount}`
        }, { status: 400 });
      }
    }
    
    // We've already handled the special case for Assistant with direct S.Manager referrals above
    // No need to check the entire downline anymore, as we're only considering direct referrals

    // Create pending rank approval instead of immediate upgrade
    const targetRank = rankConfig.next;
    if (user.hasPendingRank && user.pendingRank === targetRank) {
      return NextResponse.json({ message: 'Rank approval pending. Waiting for admin approval.', pending: true, targetRank });
    }

    await RankApproval.create({
      userId: user._id,
      currentRank: user.rank,
      targetRank
    });

    user.pendingRank = targetRank;
    user.hasPendingRank = true;
    await user.save();

    return NextResponse.json({ message: 'Rank approval requested. Waiting for admin approval.', pending: true, targetRank });

  } catch (error) {
    console.error('Rank upgrade error:', error);
    console.error('Error stack:', error.stack);
    console.error('User data:', { 
      userId: decoded?.userId, 
      rank: user?.rank, 
      totalReferralValue: user?.totalReferralValue,
      directReferrals: user?.directReferrals?.length || 0
    });
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// New function to check and upgrade the referrer if needed - only checking direct referrals
async function checkAndUpgradeReferrer(referralCode) {
  try {
    const referrer = await User.findOne({ referralCode });
    if (!referrer) return;
    
    // Check for any rank that can be upgraded
    if (referrer.rank) {
      // Get only direct referrals
      const directReferrals = await User.find({ 
        referredBy: referrer.referralCode,
        packagePurchased: { $exists: true, $ne: null }
      });
      
      let directReferralValue = 0;
      let directSManagerCount = 0;
      
      for (const referral of directReferrals) {
        if (referral.packagePurchased) {
          directReferralValue += referral.packagePurchased;
        }
        if (referral.rank === 'S.Manager') {
          directSManagerCount++;
        }
      }
      
      // Special case for Assistant rank with direct S.Manager referrals
      if (referrer.rank === 'Assistant' && directSManagerCount > 0) {
        referrer.rank = 'S.Manager';
        await referrer.save();
        console.log(`Auto-upgraded referrer ${referrer.username} from Assistant to S.Manager due to having direct S.Manager referrals`);
      }
      // For Manager rank, check if they qualify for S.Manager
      else if (referrer.rank === 'Manager' && directSManagerCount > 0) {
        referrer.rank = 'S.Manager';
        await referrer.save();
        console.log(`Auto-upgraded referrer ${referrer.username} from Manager to S.Manager due to having direct S.Manager referrals`);
      }
      // Check if direct referral value meets requirement for rank upgrade
      else if (referrer.rank === 'Assistant' && directReferralValue >= RANK_REQUIREMENTS['Assistant'].requirement) {
        referrer.rank = 'Manager';
        await referrer.save();
        console.log(`Auto-upgraded referrer ${referrer.username} from Assistant to Manager due to direct referral value: ${directReferralValue}`);
      }
      else if (referrer.rank === 'Manager' && directReferralValue >= RANK_REQUIREMENTS['Manager'].requirement) {
        referrer.rank = 'S.Manager';
        await referrer.save();
        console.log(`Auto-upgraded referrer ${referrer.username} from Manager to S.Manager due to direct referral value: ${directReferralValue}`);
      }
      
      // Continue the chain - check if this referrer's referrer should also be upgraded
      if (referrer.referredBy) {
        await checkAndUpgradeReferrer(referrer.referredBy);
      }
    }
  } catch (error) {
    console.error('Error in checkAndUpgradeReferrer:', error);
  }
}

// New function to count ONLY direct referrals with specific rank
async function countDirectTeamMembers(referralCode, targetRank) {
  try {
    // Get ONLY direct referrals with the target rank
    const directReferrals = await User.find({ 
      referredBy: referralCode,
      rank: targetRank,
      packagePurchased: { $exists: true, $ne: null }
    });
    
    console.log(`Direct team analysis for referral code ${referralCode}:`, {
      targetRank,
      directTargetRankCount: directReferrals.length,
      directMembers: directReferrals.map(m => ({ username: m.username, rank: m.rank }))
    });
    
    return directReferrals.length;
  } catch (error) {
    console.error('Error counting direct team members:', error);
    return 0;
  }
}

// Keep old function for backward compatibility (if needed elsewhere)
async function countTeamMembers(userId, targetRank) {
  try {
    // Get all users referred by this user (direct and indirect)
    const user = await User.findById(userId);
    if (!user) return 0;

    const teamMembers = await getTeamMembers(user.referralCode);
    const targetRankMembers = teamMembers.filter(member => member.rank === targetRank);
    
    console.log(`Team analysis for user ${user.username} (${user.referralCode}):`, {
      totalTeamMembers: teamMembers.length,
      targetRank,
      targetRankCount: targetRankMembers.length,
      allRanks: teamMembers.map(m => ({ username: m.username, rank: m.rank }))
    });
    
    return targetRankMembers.length;
  } catch (error) {
    console.error('Error counting team members:', error);
    return 0;
  }
}

async function getTeamMembers(referralCode, visited = new Set()) {
  if (visited.has(referralCode)) return [];
  visited.add(referralCode);

  // Log the referral code being processed
  console.log(`Getting team members for referral code: ${referralCode}`);
  
  const directReferrals = await User.find({ referredBy: referralCode });
  console.log(`Found ${directReferrals.length} direct referrals for ${referralCode}`);
  
  let allMembers = [...directReferrals];

  for (const member of directReferrals) {
    console.log(`Processing team member: ${member.username}, rank: ${member.rank}`);
    const indirectMembers = await getTeamMembers(member.referralCode, visited);
    allMembers = allMembers.concat(indirectMembers);
  }

  return allMembers;
}
