import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
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
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get team statistics
    const teamStats = await getTeamStats(user.referralCode);

    // Get direct referrals count (only those with approved packages)
    const directReferrals = await User.find({ 
      referredBy: user.referralCode,
      packagePurchased: { $exists: true, $ne: null }
    });
    
    return NextResponse.json({
      directReferrals: directReferrals.length,
      teamSize: teamStats.totalMembers,
      teamVolume: user.totalReferralValue || 0,
      totalTeamMembers: teamStats.totalMembers,
      assistantCount: teamStats.assistantCount,
      managerCount: teamStats.managerCount,
      sManagerCount: teamStats.sManagerCount,
      dManagerCount: teamStats.dManagerCount,
      gManagerCount: teamStats.gManagerCount,
      directorCount: teamStats.directorCount
    });

  } catch (error) {
    console.error('Team stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getTeamStats(referralCode) {
  const teamMembers = await getTeamMembers(referralCode);
  
  const stats = {
    totalMembers: teamMembers.length,
    assistantCount: 0,
    managerCount: 0,
    sManagerCount: 0,
    dManagerCount: 0,
    gManagerCount: 0,
    directorCount: 0
  };

  teamMembers.forEach(member => {
    switch (member.rank) {
      case 'Assistant':
        stats.assistantCount++;
        break;
      case 'Manager':
        stats.managerCount++;
        break;
      case 'S.Manager':
        stats.sManagerCount++;
        break;
      case 'D.Manager':
        stats.dManagerCount++;
        break;
      case 'G.Manager':
        stats.gManagerCount++;
        break;
      case 'Director':
        stats.directorCount++;
        break;
    }
  });

  return stats;
}

async function getTeamMembers(referralCode, visited = new Set()) {
  if (visited.has(referralCode)) return [];
  visited.add(referralCode);

  // Only include users with approved packages
  const directReferrals = await User.find({ 
    referredBy: referralCode,
    packagePurchased: { $exists: true, $ne: null }
  });
  let allMembers = [...directReferrals];

  for (const member of directReferrals) {
    const indirectMembers = await getTeamMembers(member.referralCode, visited);
    allMembers = allMembers.concat(indirectMembers);
  }

  return allMembers;
}
