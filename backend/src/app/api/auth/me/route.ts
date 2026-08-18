import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    
    if (decoded.role !== 'GUIDE' && decoded.role !== 'SUPERADMIN' && decoded.role !== 'guide') {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

    const guide = await prisma.guide.findUnique({ where: { id: decoded.id } });
    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    return NextResponse.json({ guide: { id: guide.id, name: guide.name, email: guide.email, role: guide.role, status: guide.status } });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
