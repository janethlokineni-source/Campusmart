import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';
import { hashPassword, signToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  studentId: z.string().optional(),
  phone: z.string().optional(),
  hostelBlock: z.string().optional(),
  roomNumber: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = RegisterSchema.parse(body);

    const existing = await DataStore.findUserByEmail(validated.email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this Gmail address already exists. Please log in.' },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(validated.password);
    const newUser = await DataStore.createUser({
      name: validated.name,
      email: validated.email,
      passwordHash,
      studentId: validated.studentId,
      phone: validated.phone,
      role: 'customer',
    });

    if (validated.hostelBlock && validated.roomNumber) {
      await DataStore.addAddressToUser(newUser.id, {
        fullName: validated.name,
        phone: validated.phone || '',
        hostelBlock: validated.hostelBlock,
        roomNumber: validated.roomNumber,
        isDefault: true,
      });
    }

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        studentId: newUser.studentId,
        phone: newUser.phone,
        addresses: newUser.addresses,
      },
      token,
      message: 'Campus account registered successfully!',
    });

    res.cookies.set('campusmart_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.errors || err?.message || 'Registration failed' },
      { status: 400 }
    );
  }
}

