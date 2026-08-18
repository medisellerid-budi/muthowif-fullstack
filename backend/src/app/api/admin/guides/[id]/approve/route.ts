import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

async function verifySuperAdmin(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== 'SUPERADMIN') return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await verifySuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const guide = await prisma.guide.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    return NextResponse.json({ message: 'Guide approved successfully', guide });
  } catch (error) {
    console.error('[POST /admin/guides/approve]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
