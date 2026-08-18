import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validasi input
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter.' }, { status: 400 });
    }

    // Cek apakah email sudah terdaftar
    const existing = await prisma.guide.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Buat guide baru (otomatis role: GUIDE, status: PENDING)
    const guide = await prisma.guide.create({
      data: { name, email, password: hashedPassword },
    });

    return NextResponse.json(
      { 
        message: 'Pendaftaran berhasil. Silakan tunggu persetujuan Admin sebelum login.',
        guide: { id: guide.id, name: guide.name, email: guide.email, status: guide.status } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /auth/register]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
