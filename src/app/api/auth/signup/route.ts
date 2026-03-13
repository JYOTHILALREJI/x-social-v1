import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password, dob } = await request.json();
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username: email.split('@')[0], 
        password: hashedPassword,
        dob: new Date(dob),
      },
    });

    return NextResponse.json({ message: "User created" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }
}