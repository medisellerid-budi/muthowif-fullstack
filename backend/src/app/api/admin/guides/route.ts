import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Middleware to verify if user is SUPERADMIN
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

export async function GET(request: Request) {
  try {
    const admin = await verifySuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Superadmin access required.' }, { status: 403 });
    }

    const guides = await prisma.guide.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ guides });
  } catch (error) {
    console.error('[GET /admin/guides]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
