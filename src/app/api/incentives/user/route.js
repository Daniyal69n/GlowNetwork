import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import Incentive from '../../../../../models/Incentive';
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

    // Fetch user's incentive applications
    const incentives = await Incentive.find({ userId: decoded.userId })
      .sort({ appliedAt: -1 });

    // Get user data for eligibility checks
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate current eligibility for each incentive type
    const eligibility = await calculateEligibility(user);

    return NextResponse.json({
      incentives,
      eligibility,
      user: {
        rank: user.rank,
        referralCode: user.referralCode
      }
    });

  } catch (error) {
    console.error('Fetch user incentives error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function calculateEligibility(user) {
  try {
    const eligibility = {
      umrahTicket: { eligible: false, reason: '', alreadyApplied: false },
      carPlan: { eligible: false, reason: '', alreadyApplied: false },
      monthlySalary: { eligible: false, reason: '', alreadyApplied: false }
    };

    // Check for existing applications
    const existingApplications = await Incentive.find({
      userId: user._id,
      status: { $in: ['pending', 'approved'] }
    });

    // Umrah Ticket - Global Manager (once)
    const umrahApplication = existingApplications.find(app => app.type === 'umrahTicket');
    if (umrahApplication) {
      eligibility.umrahTicket.alreadyApplied = true;
      eligibility.umrahTicket.reason = `Already ${umrahApplication.status}`;
    } else if (user.rank === 'G.Manager') {
      eligibility.umrahTicket.eligible = true;
    } else {
      eligibility.umrahTicket.reason = 'Must be Global Manager';
    }

    // Car Plan - Director with 2 direct Directors (once)
    const carApplication = existingApplications.find(app => app.type === 'carPlan');
    if (carApplication) {
      eligibility.carPlan.alreadyApplied = true;
      eligibility.carPlan.reason = `Already ${carApplication.status}`;
    } else if (user.rank === 'Director') {
      const directDirectors = await User.countDocuments({
        referredBy: user.referralCode,
        rank: 'Director',
        packagePurchased: { $exists: true, $ne: null }
      });
      
      if (directDirectors >= 2) {
        eligibility.carPlan.eligible = true;
      } else {
        eligibility.carPlan.reason = `Need 2 direct Directors (have ${directDirectors})`;
      }
    } else {
      eligibility.carPlan.reason = 'Must be Director';
    }

    // Monthly Salary - Director with 2 direct S.Managers this month (monthly)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyApplication = existingApplications.find(
      app => app.type === 'monthlySalary' && app.month === currentMonth
    );
    
    if (monthlyApplication) {
      eligibility.monthlySalary.alreadyApplied = true;
      eligibility.monthlySalary.reason = `Already ${monthlyApplication.status} for ${currentMonth}`;
    } else if (user.rank === 'Director') {
      // Count direct S.Managers who became S.Manager this month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

      const directSManagersThisMonth = await User.countDocuments({
        referredBy: user.referralCode,
        rank: 'S.Manager',
        packagePurchased: { $exists: true, $ne: null },
        updatedAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      if (directSManagersThisMonth >= 2) {
        eligibility.monthlySalary.eligible = true;
      } else {
        eligibility.monthlySalary.reason = `Need 2 direct S.Managers this month (have ${directSManagersThisMonth})`;
      }
    } else {
      eligibility.monthlySalary.reason = 'Must be Director';
    }

    return eligibility;

  } catch (error) {
    console.error('Eligibility calculation error:', error);
    return {
      umrahTicket: { eligible: false, reason: 'Error checking eligibility' },
      carPlan: { eligible: false, reason: 'Error checking eligibility' },
      monthlySalary: { eligible: false, reason: 'Error checking eligibility' }
    };
  }
}
