import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import Order from '../../../../../models/Order';
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

    const { orderId, action } = await request.json();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Allow dispatching approved orders
    if (action === 'dispatched' && order.status === 'approved') {
      // This is fine - we can dispatch an approved order
    } else if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Order already processed' }, { status: 400 });
    }

    order.status = action;
    order.approvedBy = decoded.userId === 'admin' ? null : decoded.userId;
    order.approvedAt = new Date();

    await order.save();
    
    // Reset the hasPendingOrder flag for the user
    await User.findByIdAndUpdate(order.userId, {
      hasPendingOrder: false
    });

    return NextResponse.json({
      message: `Order ${action} successfully`
    });

  } catch (error) {
    console.error('Order approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
