import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import Payout from '../../../../../models/Payout';
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

    // Fetch all payouts for the user
    const payouts = await Payout.find({ userId: decoded.userId })
      .populate('sourceUserId', 'username')
      .sort({ createdAt: -1 });

    console.log('User payouts:', {
      userId: decoded.userId,
      payoutsCount: payouts.length,
      payouts: payouts.map(p => ({
        id: p._id,
        type: p.type,
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt
      }))
    });

    return NextResponse.json({
      payouts
    });

  } catch (error) {
    console.error('User payouts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
