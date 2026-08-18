export interface TourSession {
  id: string;
  title: string;
  location: string | null;
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED';
  _count?: {
    participants: number;
    expectedParticipants: number;
  };
}
