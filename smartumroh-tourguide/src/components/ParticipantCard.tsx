import React from 'react';

interface ParticipantCardProps {
  name: string;
  phoneNumber: string;
  status: 'ONLINE' | 'OFFLINE';
  initial: string;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({ name, phoneNumber, status, initial }) => {
  const isOnline = status === 'ONLINE';

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${isOnline ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-600'}`}>
        {initial}
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-zinc-900">{name}</p>
        <p className="text-[10px] text-zinc-500">{phoneNumber}</p>
      </div>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium ${isOnline ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-500'}`}>
        {status}
      </span>
    </div>
  );
};
