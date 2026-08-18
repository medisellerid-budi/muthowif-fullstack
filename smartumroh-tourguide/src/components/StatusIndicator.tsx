import React from 'react';

interface StatusIndicatorProps {
  label: string;
  colorClass: string; // e.g., 'bg-red-500', 'text-red-500'
  pulseColorClass: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ label, colorClass, pulseColorClass }) => {
  return (
    <div className="flex items-center gap-2 mb-6 mt-12">
      <span className={`w-2 h-2 rounded-full ${pulseColorClass}`} style={{ animation: 'pulse-dot 1.5s infinite' }}></span>
      <span className={`text-xs font-bold tracking-[0.3em] ${colorClass}`}>{label}</span>
    </div>
  );
};
