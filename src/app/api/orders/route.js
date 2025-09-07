import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Order from '../../../../models/Order';
import User from '../../../../models/User';
import { verifyToken } from '../../../../lib/auth';

// GET - Fetch user's orders
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

    const orders = await Order.find({ userId: decoded.userId })
      .sort({ createdAt: -1 });

    return NextResponse.json({ orders });

  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new order
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

    const body = await request.json();
    console.log('Order request body:', body);

    const { products, totalAmount, orderDetails } = body;

    // Validation
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'Products are required' }, { status: 400 });
    }

    if (!orderDetails || !orderDetails.address || !orderDetails.phone) {
      return NextResponse.json({ error: 'Order details (address, phone) are required' }, { status: 400 });
    }

    // Get user's available amount (package amount - delivery fee)
    const user = await User.findById(decoded.userId);
    if (!user || !user.packagePurchased) {
      return NextResponse.json({ error: 'No package purchased' }, { status: 400 });
    }
    
    // Check if user already has a pending order
    if (user.hasPendingOrder) {
      return NextResponse.json({ error: 'You already have a pending order. Please wait for admin approval.' }, { status: 400 });
    }

    const DELIVERY_FEES = { 20000: 1000, 50000: 1500, 100000: 2000 };
    const availableAmount = user.packagePurchased - DELIVERY_FEES[user.packagePurchased];

    // Process products
    const orderProducts = products.map(item => ({
      productId: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity) || 1
    }));

    // Calculate total amount
    const calculatedTotal = orderProducts.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const finalTotal = totalAmount || calculatedTotal;

    console.log('Available amount:', availableAmount);
    console.log('Order total:', finalTotal);

    // Check if total amount equals available amount
    if (finalTotal !== availableAmount) {
      return NextResponse.json({
        error: `Order total must equal your available amount: ₨${availableAmount}. Current total: ₨${finalTotal}`
      }, { status: 400 });
    }

    // Create the order
    const order = new Order({
      userId: decoded.userId,
      products: orderProducts,
      totalAmount: finalTotal,
      orderDetails,
      status: 'pending'
    });

    const savedOrder = await order.save();
    console.log('Order saved successfully:', savedOrder._id);

    // Deduct the order amount from user's available balance and set hasPendingOrder flag
    await User.findByIdAndUpdate(decoded.userId, {
      $inc: { packagePurchased: -finalTotal },
      hasPendingOrder: true
    });

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully and sent for approval',
      orderId: savedOrder._id,
      order: savedOrder
    });

  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
