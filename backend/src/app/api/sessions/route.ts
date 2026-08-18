import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGuideFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const guide = await getGuideFromRequest(request);
  if (!guide) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessions = await prisma.tourSession.findMany({
    where: { guideId: guide.id },
    include: { _count: { select: { participants: true, expectedParticipants: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const guide = await getGuideFromRequest(request);
  if (!guide) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, location, durationDays, expectedParticipants } = await request.json();
    
    // Compute endsAt from durationDays (default 7 days if not provided)
    const days = typeof durationDays === 'number' && durationDays > 0 ? durationDays : 7;
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + days);
    endsAt.setHours(23, 59, 59, 999); // End of day

    // Generate a unique room name
    const livekitRoomName = `room-${title.toLowerCase().replace(/\s+/g, '-').slice(0,12)}-${Date.now().toString(36)}`;

    const session = await prisma.tourSession.create({
      data: {
        title,
        location,
        guideId: guide.id,
        livekitRoomName,
        endsAt,
        expectedParticipants: expectedParticipants ? {
          create: expectedParticipants.map((p: any) => ({ name: p.name, email: p.email }))
        } : undefined
      }
    });

    return NextResponse.json({ ...session }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /sessions] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
