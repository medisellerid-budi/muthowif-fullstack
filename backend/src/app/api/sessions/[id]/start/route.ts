import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createParticipantToken, roomService } from '@/lib/livekit';
import { getGuideFromRequest } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guide = await getGuideFromRequest(request);
  const { id } = await params;
  if (!guide) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const session = await prisma.tourSession.findUnique({
      where: { id }
    });

    if (!session || session.guideId !== guide.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'ENDED') {
      return NextResponse.json({ error: 'Session already ended' }, { status: 400 });
    }

    // Update status to ACTIVE
    const updatedSession = await prisma.tourSession.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });

    // Generate Guide token for LiveKit
    const livekitToken = await createParticipantToken(session.livekitRoomName, guide.name, true);

    return NextResponse.json({ session: updatedSession, livekitToken });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
