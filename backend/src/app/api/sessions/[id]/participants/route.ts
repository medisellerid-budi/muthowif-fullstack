import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { roomService } from '@/lib/livekit';
import { getGuideFromRequest } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guide = await getGuideFromRequest(request);
  const { id } = await params;
  if (!guide) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const session = await prisma.tourSession.findUnique({ where: { id } });

    if (!session || session.guideId !== guide.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch all participants from DB
    const participants = await prisma.sessionParticipant.findMany({
      where: { sessionId: id },
      orderBy: { joinedAt: 'asc' }
    });

    // Query LiveKit for who is currently connected
    let onlineNames = new Set<string>();
    try {
      const livekitParticipants = await roomService.listParticipants(session.livekitRoomName);
      onlineNames = new Set(livekitParticipants.map(p => p.identity));
    } catch {
      // LiveKit room might not exist yet (session not started) — treat everyone as offline
    }

    const enriched = participants.map(p => ({
      ...p,
      isOnline: onlineNames.has(p.name),
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
