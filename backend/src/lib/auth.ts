import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

/**
 * Extracts and verifies Guide identity from a Bearer JWT in the request.
 * Returns the Guide record from DB if valid, or null otherwise.
 */
export async function getGuideFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[auth] No valid auth header');
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    console.log('[auth] Decoded token:', decoded);
    if (decoded.role !== 'GUIDE' && decoded.role !== 'guide') {
      console.log('[auth] Role mismatch:', decoded.role);
      return null;
    }
    const guide = await prisma.guide.findUnique({ where: { id: decoded.id } });
    if (!guide) console.log('[auth] Guide not found in DB');
    return guide;
  } catch (err: any) {
    console.log('[auth] JWT Verification failed:', err.message);
    return null;
  }
}
