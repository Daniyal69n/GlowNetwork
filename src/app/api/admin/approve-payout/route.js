import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import Payout from '../../../../../models/Payout';
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

    const { payoutId, action } = await request.json();

    const payout = await Payout.findById(payoutId);
    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }

    if (payout.status !== 'pending') {
      return NextResponse.json({ error: 'Payout already processed' }, { status: 400 });
    }

    payout.status = action;
    payout.approvedBy = decoded.userId === 'admin' ? null : decoded.userId;
    payout.approvedAt = new Date();

    await payout.save();

    return NextResponse.json({
      message: `Payout ${action} successfully`
    });

  } catch (error) {
    console.error('Payout approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
