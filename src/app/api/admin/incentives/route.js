import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import Incentive from '../../../../../models/Incentive';
import { verifyToken } from '../../../../../lib/auth';

// GET - Fetch pending incentive applications
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

    // Fetch all pending incentive applications
    const pendingIncentives = await Incentive.find({ status: 'pending' })
      .populate('userId', 'username phone rank')
      .sort({ appliedAt: -1 });

    return NextResponse.json({ incentives: pendingIncentives });

  } catch (error) {
    console.error('Fetch incentives error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Approve or reject incentive application
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

    const { incentiveId, action, notes } = await request.json();
    if (!incentiveId || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const incentive = await Incentive.findById(incentiveId);
    if (!incentive) {
      return NextResponse.json({ error: 'Incentive application not found' }, { status: 404 });
    }

    if (incentive.status !== 'pending') {
      return NextResponse.json({ error: 'Incentive already processed' }, { status: 400 });
    }

    // Update incentive status
    incentive.status = action;
    incentive.processedAt = new Date();
    incentive.processedBy = decoded.userId === 'admin' ? null : decoded.userId;
    if (notes) incentive.notes = notes;
    
    await incentive.save();

    return NextResponse.json({ 
      message: `Incentive ${action} successfully`,
      incentive: incentive
    });

  } catch (error) {
    console.error('Process incentive error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


