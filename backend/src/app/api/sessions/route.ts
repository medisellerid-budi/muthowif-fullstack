import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGuideFromRequest } from '@/lib/auth';
import { z } from 'zod';

const createSessionSchema = z.object({
  title: z.string().min(3, "Judul sesi minimal 3 karakter"),
  location: z.string().optional(),
  durationDays: z.number().positive().optional(),
  // Prefix kode akses: hanya huruf besar dan angka, max 15 karakter
  accessPrefix: z.string()
    .max(15, "Prefix maksimal 15 karakter")
    .regex(/^[A-Z0-9]+$/, "Prefix hanya boleh huruf kapital dan angka")
    .default("TOUR")
    .transform(v => v.toUpperCase()),
  expectedParticipants: z.array(
    z.object({
      name: z.string().min(1, "Nama peserta wajib diisi"),
      email: z.string().email("Format email tidak valid").optional().or(z.literal('')),
    })
  ).optional()
});

export async function GET(request: Request) {
  const guide = await getGuideFromRequest(request);
  if (!guide) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessions = await prisma.tourSession.findMany({
    where: { guideId: guide.id },
    include: { _count: { select: { participants: true, expectedParticipants: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const guide = await getGuideFromRequest(request);
  if (!guide) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const validatedData = createSessionSchema.parse(body);
    const { title, location, durationDays, expectedParticipants, accessPrefix } = validatedData;
    
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
        accessPrefix,
        endsAt,
        expectedParticipants: expectedParticipants ? {
          create: expectedParticipants.map((p: any) => ({ name: p.name, email: p.email }))
        } : undefined
      }
    });

    return NextResponse.json({ ...session }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[POST /sessions] Error:', message);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
