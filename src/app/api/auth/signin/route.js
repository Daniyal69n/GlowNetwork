import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import { verifyPassword, generateToken } from '../../../../../lib/auth';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { phone, password } = await request.json();

    // Validate required fields
    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Phone and password are required' },
        { status: 400 }
      );
    }

    // Normalize phone for validation and lookup
    const normalizedPhoneRaw = typeof phone === 'string' || typeof phone === 'number' ? String(phone) : '';
    const normalizedPhone = normalizedPhoneRaw.trim();

    // Check for admin credentials
    if (phone === process.env.ADMIN_PHONE && password === process.env.ADMIN_PASSWORD) {
      const token = generateToken('admin', true);
      return NextResponse.json({
        message: 'Admin login successful',
        token,
        user: {
          id: 'admin',
          phone: process.env.ADMIN_PHONE,
          username: 'Admin',
          isAdmin: true
        }
      });
    }

    // Validate phone must be exactly 11 digits for normal users
    if (!/^\d{11}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Phone number must be exactly 11 digits' },
        { status: 400 }
      );
    }

    // Find user by phone
    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid phone or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid phone or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(user._id, user.isAdmin);

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
        referralCode: user.referralCode,
        rank: user.rank,
        packagePurchased: user.packagePurchased,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
