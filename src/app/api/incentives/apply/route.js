import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import Incentive from '../../../../../models/Incentive';
import { verifyToken } from '../../../../../lib/auth';

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

    const { incentiveType } = await request.json();
    
    if (!['umrahTicket', 'carPlan', 'monthlySalary'].includes(incentiveType)) {
      return NextResponse.json({ error: 'Invalid incentive type' }, { status: 400 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check eligibility based on incentive type
    const eligibilityCheck = await checkEligibility(user, incentiveType);
    if (!eligibilityCheck.eligible) {
      return NextResponse.json({ error: eligibilityCheck.reason }, { status: 400 });
    }

    // Check if already applied (for one-time incentives)
    if (incentiveType !== 'monthlySalary') {
      const existingApplication = await Incentive.findOne({
        userId: user._id,
        type: incentiveType,
        status: { $in: ['pending', 'approved'] }
      });

      if (existingApplication) {
        return NextResponse.json({ 
          error: `You have already applied for ${incentiveType}` 
        }, { status: 400 });
      }
    } else {
      // For monthly salary, check if already applied for current month
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const existingMonthlyApplication = await Incentive.findOne({
        userId: user._id,
        type: 'monthlySalary',
        month: currentMonth,
        status: { $in: ['pending', 'approved'] }
      });

      if (existingMonthlyApplication) {
        return NextResponse.json({ 
          error: `You have already applied for monthly salary for ${currentMonth}` 
        }, { status: 400 });
      }
    }

    // Create incentive application
    const incentiveData = {
      userId: user._id,
      type: incentiveType,
      eligibilityData: eligibilityCheck.data
    };

    if (incentiveType === 'monthlySalary') {
      incentiveData.month = new Date().toISOString().slice(0, 7);
    }

    const incentive = new Incentive(incentiveData);
    await incentive.save();

    return NextResponse.json({
      message: `${incentiveType} application submitted successfully`,
      incentiveId: incentive._id
    });

  } catch (error) {
    console.error('Incentive application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function checkEligibility(user, incentiveType) {
  try {
    switch (incentiveType) {
      case 'umrahTicket':
        // Global Manager can apply for Umrah Ticket (once)
        if (user.rank !== 'G.Manager') {
          return { 
            eligible: false, 
            reason: 'You must be a Global Manager to apply for Umrah Ticket' 
          };
        }
        return {
          eligible: true,
          data: { rank: user.rank }
        };

      case 'carPlan':
        // Director with 2 direct Directors can apply for Car Plan (once)
        if (user.rank !== 'Director') {
          return { 
            eligible: false, 
            reason: 'You must be a Director to apply for Car Plan' 
          };
        }

        // Count direct Directors
        const directDirectors = await User.countDocuments({
          referredBy: user.referralCode,
          rank: 'Director',
          packagePurchased: { $exists: true, $ne: null }
        });

        if (directDirectors < 2) {
          return { 
            eligible: false, 
            reason: `You need 2 direct Directors to apply for Car Plan. You currently have ${directDirectors}` 
          };
        }

        return {
          eligible: true,
          data: { rank: user.rank, directDirectors }
        };

      case 'monthlySalary':
        // Director with 2 direct S.Managers in current month can apply for Monthly Salary (₹40k)
        if (user.rank !== 'Director') {
          return { 
            eligible: false, 
            reason: 'You must be a Director to apply for Monthly Salary' 
          };
        }

        // Count direct S.Managers who became S.Manager this month
        const currentMonth = new Date();
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

        const directSManagersThisMonth = await User.countDocuments({
          referredBy: user.referralCode,
          rank: 'S.Manager',
          packagePurchased: { $exists: true, $ne: null },
          // Assuming we track when they became S.Manager (you might need to add a field for this)
          updatedAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        if (directSManagersThisMonth < 2) {
          return { 
            eligible: false, 
            reason: `You need 2 direct S.Managers who achieved the rank this month. You currently have ${directSManagersThisMonth}` 
          };
        }

        return {
          eligible: true,
          data: { 
            rank: user.rank, 
            directSManagersInMonth: directSManagersThisMonth 
          }
        };

      default:
        return { 
          eligible: false, 
          reason: 'Invalid incentive type' 
        };
    }
  } catch (error) {
    console.error('Eligibility check error:', error);
    return { 
      eligible: false, 
      reason: 'Error checking eligibility' 
    };
  }
}
