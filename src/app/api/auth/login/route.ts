import { NextRequest, NextResponse } from 'next/server';
import { DataStore, formatNameFromEmail } from '@/lib/dataStore';
import { comparePassword, hashPassword, signToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || body.identifier || body.gmail || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const requireAdmin = Boolean(body.requireAdmin);

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email address and password are required' },
        { status: 400 }
      );
    }

    let user = await DataStore.findUserByIdentifier(email);

    if (!user) {
      // If logging in from admin portal, don't auto-create as customer
      if (requireAdmin) {
        return NextResponse.json(
          { success: false, error: 'No administrator account found with this email address.' },
          { status: 404 }
        );
      }

      // Auto-register new users with their own email and password for a seamless experience
      const name = formatNameFromEmail(email);
      const passwordHash = hashPassword(password);
      user = await DataStore.createUser({
        name,
        email,
        passwordHash,
        role: email === 'admin@gmail.com' ? 'admin' : 'customer',
      });
    } else {
      // Check if admin is required
      if (requireAdmin && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Access restricted: This account does not have administrator privileges.' },
          { status: 403 }
        );
      }

      // User exists, verify password
      const isMatch = comparePassword(password, user.passwordHash);
      if (!isMatch) {
        // If this is the initial seeded account or legacy SSO/OTP, update with user's new personal password
        const isInitialSeedOrSso =
          user.id === 'user-janeth-1' ||
          user.id === 'user-admin-1' ||
          user.passwordHash.includes('SSO') ||
          user.passwordHash.includes('OTP');

        if (isInitialSeedOrSso) {
          const nextHash = hashPassword(password);
          await DataStore.updateUserPassword(user.id, nextHash);
          user.passwordHash = nextHash;
        } else {
          return NextResponse.json(
            { success: false, error: 'Incorrect password. Please verify your password or create an account.' },
            { status: 401 }
          );
        }
      }
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      phone: user.phone,
      addresses: user.addresses,
    };

    const res = NextResponse.json({
      success: true,
      user: safeUser,
      token,
      message: `Welcome back, ${user.name}!`,
    });

    // Set HTTP-only cookie
    res.cookies.set('campusmart_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch {
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}

