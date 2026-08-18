import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    const expected = await prisma.expectedParticipant.findMany({
      where: { sessionId: id },
      orderBy: { name: 'asc' },
    });

    // Ambil nama peserta yang sudah join
    const joined = await prisma.sessionParticipant.findMany({
      where: { sessionId: id },
      select: { name: true },
    });
    const joinedNames = new Set(joined.map(p => p.name.toLowerCase().trim()));

    // Tandai masing-masing expected participant apakah sudah join atau belum
    const enriched = expected.map(ep => ({
      ...ep,
      hasJoined: joinedNames.has(ep.name.toLowerCase().trim()),
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guide = await getGuideFromRequest(request);
  const { id } = await params;
  if (!guide) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const session = await prisma.tourSession.findUnique({ where: { id } });
    if (!session || session.guideId !== guide.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { participants } = await request.json(); // Array of { name, email }

    if (!Array.isArray(participants)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Gunakan transaksi untuk menghapus yang lama dan memasukkan yang baru
    // agar selalu sync dengan daftar terbaru
    await prisma.$transaction(async (tx) => {
      // Hapus semua expected participants lama untuk sesi ini
      await tx.expectedParticipant.deleteMany({
        where: { sessionId: id },
      });

      // Insert data baru
      if (participants.length > 0) {
        await tx.expectedParticipant.createMany({
          data: participants.map((p: any) => ({
            sessionId: id,
            name: p.name.trim(),
            email: p.email?.trim() || null,
          })),
        });
      }
    });

    return NextResponse.json({ success: true, count: participants.length });
  } catch (error) {
    console.error('Failed to update expected participants:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
