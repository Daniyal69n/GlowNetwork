import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import Order from '../../../../../models/Order';
import User from '../../../../../models/User';
import { verifyToken } from '../../../../../lib/auth';

// PUT - Update order status
export async function PUT(request, { params }) {
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

    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { orderId } = params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Valid status values
    const validStatuses = ['pending', 'approved', 'rejected', 'dispatched'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update order status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { 
        status,
        approvedBy: status === 'approved' ? decoded.userId : null,
        approvedAt: status === 'approved' ? new Date() : null
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Order ${status} successfully`,
      order: updatedOrder
    });

  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get specific order details
export async function GET(request, { params }) {
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

    const { orderId } = params;

    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user owns this order or is admin
    const user = await User.findById(decoded.userId);
    if (!user.isAdmin && order.userId.toString() !== decoded.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ order });

  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
