import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const guide = await prisma.guide.findUnique({ where: { email } });

    if (!guide) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Support both bcrypt hashed passwords and legacy plain-text (for migration)
    const isValid = guide.password.startsWith('$2')
      ? await bcrypt.compare(password, guide.password)
      : guide.password === password;

    if (!isValid) {
      return NextResponse.json({ error: 'Kredensial tidak valid' }, { status: 401 });
    }

    if (guide.status === 'PENDING') {
      return NextResponse.json({ error: 'Akun Anda sedang menunggu persetujuan Admin.' }, { status: 403 });
    }

    if (guide.status === 'REJECTED') {
      return NextResponse.json({ error: 'Akun Anda telah ditolak oleh Admin.' }, { status: 403 });
    }

    const token = jwt.sign(
      { id: guide.id, email: guide.email, role: guide.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return NextResponse.json({ token, guide: { id: guide.id, name: guide.name, email: guide.email, role: guide.role } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
