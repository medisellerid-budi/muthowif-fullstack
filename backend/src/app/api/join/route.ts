import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createParticipantToken } from '@/lib/livekit';

export async function POST(request: Request) {
  try {
    // Accept both 'name' (from frontend) and 'participantName' (legacy)
    const body = await request.json();
    const participantName: string = body.name || body.participantName;
    const deviceId: string | undefined = body.deviceId;

    // Accept full UUID or 'UMROH-XXXXXX' format where XXXXXX is the UUID prefix
    let sessionId: string = body.sessionId || '';
    if (sessionId.startsWith('UMROH-')) {
      // Frontend sends UMROH-{first-6-chars-of-UUID}, find matching session
      const prefix = sessionId.replace('UMROH-', '').toLowerCase();
      const session = await prisma.tourSession.findFirst({
        where: { id: { startsWith: prefix } }
      });
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      sessionId = session.id;
    }

    if (!sessionId || !participantName) {
      return NextResponse.json({ error: 'Missing sessionId or name' }, { status: 400 });
    }

    const session = await prisma.tourSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'ENDED') {
      return NextResponse.json({ error: 'Sesi sudah berakhir.' }, { status: 403 });
    }

    // Check if session has expired
    if (session.endsAt && new Date() > session.endsAt) {
      return NextResponse.json({
        error: `Sesi sudah kadaluarsa sejak ${new Date(session.endsAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`
      }, { status: 403 });
    }

    if (session.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Sesi belum aktif. Guide harus mulai broadcast terlebih dahulu.' }, { status: 403 });
    }

    // ── Device-based reconnect ──────────────────────────────────────────────
    // Jika deviceId dikirim, cek apakah device ini sudah pernah join sesi ini.
    // Jika ya → kembalikan data lama + token baru (reconnect tanpa duplikasi).
    if (deviceId) {
      const existingParticipant = await prisma.sessionParticipant.findUnique({
        where: {
          sessionId_deviceId: { sessionId: session.id, deviceId }
        }
      });

      if (existingParticipant) {
        // Device sudah terdaftar — generate token baru untuk reconnect
        const livekitToken = await createParticipantToken(
          session.livekitRoomName,
          existingParticipant.name, // Gunakan nama dari join pertama
          false
        );
        return NextResponse.json({
          session: { id: session.id, title: session.title, status: session.status },
          participant: existingParticipant,
          livekitToken,
          reconnected: true, // Flag untuk frontend
        });
      }
    }
    // ───────────────────────────────────────────────────────────────────────

    // Record the participant in the database
    const participant = await prisma.sessionParticipant.create({
      data: {
        sessionId: session.id,
        name: participantName,
        deviceId: deviceId || null,
      }
    });

    // Generate Participant token for LiveKit
    const livekitToken = await createParticipantToken(session.livekitRoomName, participantName, false);

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        status: session.status
      },
      participant,
      livekitToken,
      reconnected: false,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
