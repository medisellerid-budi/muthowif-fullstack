import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGuideFromRequest } from '@/lib/auth';

/**
 * POST /api/sessions/:id/leave
 * Guide leaves the room temporarily — session stays SCHEDULED so it can be
 * reopened later (e.g. afternoon session). LiveKit room auto-closes when empty.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guide = await getGuideFromRequest(request);
  const { id } = await params;
  if (!guide) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const session = await prisma.tourSession.findUnique({ where: { id } });

    if (!session || session.guideId !== guide.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'ENDED') {
      return NextResponse.json({ error: 'Session already ended' }, { status: 400 });
    }

    // Set back to SCHEDULED so guide can rejoin later
    const updatedSession = await prisma.tourSession.update({
      where: { id },
      data: { status: 'SCHEDULED' }
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
