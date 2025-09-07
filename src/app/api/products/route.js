import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Product from '../../../../models/Product';
import { verifyToken } from '../../../../lib/auth';

// GET - Fetch all active products
export async function GET() {
  try {
    await dbConnect();
    
    const products = await Product.find({ isActive: true })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    return NextResponse.json({ products });

  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new product (Admin only)
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

    const { name, description, price, image, category } = await request.json();

    if (!name || !description || !price) {
      return NextResponse.json({ error: 'Name, description, and price are required' }, { status: 400 });
    }

    const product = new Product({
      name,
      description,
      price,
      image: image || '',
      category: category || 'General',
      createdBy: decoded.userId === 'admin' ? null : decoded.userId
    });

    await product.save();

    return NextResponse.json({ message: 'Product created successfully', product });

  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
