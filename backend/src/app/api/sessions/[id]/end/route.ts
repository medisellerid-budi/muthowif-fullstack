import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { roomService } from '@/lib/livekit';
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

    const updatedSession = await prisma.tourSession.update({
      where: { id },
      data: { status: 'ENDED' }
    });

    // Close LiveKit room so participants are disconnected
    try {
      await roomService.deleteRoom(session.livekitRoomName);
    } catch (livekitError) {
      // Room might already be closed; non-fatal
      console.warn('Could not delete LiveKit room:', livekitError);
    }

    return NextResponse.json(updatedSession);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
