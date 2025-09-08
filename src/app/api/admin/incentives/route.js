import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
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
    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, key, action } = await request.json();
    if (!userId || !key || !['approved','rejected'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const validKeys = ['umrahTicket','fixedSalary','carPlan'];
    if (!validKeys.includes(key)) {
      return NextResponse.json({ error: 'Unknown incentive key' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update incentive status
    if (!user.incentives) user.incentives = {};
    if (!user.incentives[key]) user.incentives[key] = { status: 'locked' };
    user.incentives[key].status = action;
    await user.save();

    return NextResponse.json({ message: `Incentive ${key} ${action}` });

  } catch (error) {
    console.error('Approve incentive error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


