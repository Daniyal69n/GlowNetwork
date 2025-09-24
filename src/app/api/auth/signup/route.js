import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import { hashPassword, generateReferralCode } from '../../../../../lib/auth';

export async function POST(request) {
  try {
    await dbConnect();
    // Ensure DB indexes match the current schema (drops old unique index on username)
    try {
      await User.syncIndexes();
    } catch (_) {
      // ignore index sync errors to avoid blocking signup
    }

    // Create default user if it doesn't exist
    await createDefaultUserIfNotExists();
    
    const { username, email, phone, password, referralCode } = await request.json();

    // Normalize inputs
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedPhoneRaw = typeof phone === 'string' || typeof phone === 'number' ? String(phone) : '';
    const normalizedPhone = normalizedPhoneRaw.trim();
    const normalizedReferralCode = typeof referralCode === 'string' ? referralCode.trim() : '';

    // Validate required fields
    if (!normalizedUsername || !normalizedEmail || !normalizedPhone || !password) {
      return NextResponse.json(
        { error: 'Username, email, phone, and password are required' },
        { status: 400 }
      );
    }

    // Make referral code compulsory
    if (!normalizedReferralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Validate phone: must be exactly 11 digits
    if (!/^\d{11}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Phone number must be exactly 11 digits' },
        { status: 400 }
      );
    }

    // Validate password strength: min 8 chars, includes letter, number, and symbol
    const strongPassword = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPassword.test(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters and include letters, numbers, and a symbol' },
        { status: 400 }
      );
    }

    // Check if user already exists - return specific field error
    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    const phoneExists = await User.findOne({ phone: normalizedPhone });
    if (phoneExists) {
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 400 }
      );
    }

    // Validate referral code (now compulsory)
    const referrer = await User.findOne({ referralCode: normalizedReferralCode });
    if (!referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 400 }
      );
    }
    
    // Check if referrer has purchased a package (except for default user)
    const defaultUserPhone = process.env.DEFAULT_USER_PHONE;
    if (referrer.phone !== defaultUserPhone && !referrer.packagePurchased) {
      return NextResponse.json(
        { error: 'This referral code cannot be used. The referrer needs to purchase a package first.' },
        { status: 400 }
      );
    }
    
    const referredBy = normalizedReferralCode;

    // Generate unique referral code for new user
    let newReferralCode;
    let isUnique = false;
    while (!isUnique) {
      newReferralCode = generateReferralCode();
      const existing = await User.findOne({ referralCode: newReferralCode });
      if (!existing) {
        isUnique = true;
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      referralCode: newReferralCode,
      referredBy
    });

    await newUser.save();

    return NextResponse.json(
      { 
        message: 'User created successfully',
        referralCode: newReferralCode
      },
      { status: 201 }
    );

  } catch (error) {
    // Handle duplicate key errors from MongoDB (race conditions or index-level checks)
    if (error && (error.code === 11000 || error.name === 'MongoServerError' && error.message.includes('E11000'))) {
      const key = (error && (error.keyPattern && Object.keys(error.keyPattern)[0])) || (error.keyValue && Object.keys(error.keyValue)[0]) || '';
      const message = key === 'email' ? 'Email already exists' : key === 'phone' ? 'Phone number already exists' : 'User with this email or phone already exists';
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to create default user if it doesn't exist
async function createDefaultUserIfNotExists() {
  try {
    const defaultUserPhone = process.env.DEFAULT_USER_PHONE;
    const defaultUserName = process.env.DEFAULT_USER_NAME;
    const defaultUserPassword = process.env.DEFAULT_USER_PASSWORD;

    if (!defaultUserPhone || !defaultUserName || !defaultUserPassword) {
      console.log('Default user environment variables not set');
      return;
    }

    // Check if default user already exists
    const existingUser = await User.findOne({ phone: defaultUserPhone });
    if (existingUser) {
      return; // Default user already exists
    }

    // Generate unique referral code for default user
    let newReferralCode;
    let isUnique = false;
    while (!isUnique) {
      newReferralCode = generateReferralCode();
      const existing = await User.findOne({ referralCode: newReferralCode });
      if (!existing) {
        isUnique = true;
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(defaultUserPassword);

    // Create default user
    const defaultUser = new User({
      username: defaultUserName,
      email: `${defaultUserPhone}@glownetwork.com`, // Generate email from phone
      phone: defaultUserPhone,
      password: hashedPassword,
      referralCode: newReferralCode,
      referredBy: null // No referrer for default user
    });

    await defaultUser.save();
    console.log(`Default user created with referral code: ${newReferralCode}`);
  } catch (error) {
    console.error('Error creating default user:', error);
  }
}
