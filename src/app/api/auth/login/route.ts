import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return NextResponse.json({ error: "No user found" }, { status: 401 });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return NextResponse.json({ error: "Wrong password" }, { status: 401 });

    return NextResponse.json({ message: "Success" });
  } catch (err) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}