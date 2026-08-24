export interface TourSession {
  id: string;
  title: string;
  location: string | null;
  accessPrefix: string;  // Prefix kode akses kustom, misal: TRAVELXYZ, PIBTOUR
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED';
  endsAt?: string | null;
  _count?: {
    participants: number;
    expectedParticipants: number;
  };
}
