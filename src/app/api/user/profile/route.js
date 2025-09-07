import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import Transaction from '../../../../../models/Transaction';
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
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has any pending package purchase that has been approved
    const packageTransaction = await Transaction.findOne({
      userId: user._id,
      type: 'package_purchase',
      status: 'approved'
    }).lean();

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('User profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
