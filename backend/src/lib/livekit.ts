import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

// Ensure the necessary env vars are present
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const wsUrl = process.env.LIVEKIT_URL;

if (!apiKey || !apiSecret || !wsUrl) {
  throw new Error("LiveKit credentials are not configured in environment variables");
}

export const roomService = new RoomServiceClient(wsUrl, apiKey, apiSecret);

export async function createParticipantToken(
  roomName: string,
  participantName: string,
  isGuide: boolean = false
) {
  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    name: participantName,
  });
  
  at.addGrant({ 
    roomJoin: true, 
    room: roomName,
    // Semua peserta dapat canPublish: true agar bisa publish audio saat dipanggil guide.
    // Mic tetap mati (muted) secara default dari sisi frontend.
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return await at.toJwt();
}
