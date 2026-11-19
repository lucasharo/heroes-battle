import React from 'react';
import { EmoteId } from '../game/emotes';

export const EmoteTriggerIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path
      d="M12 3C6.75 3 2.5 6.8 2.5 11.5C2.5 13.95 3.65 16.15 5.5 17.7L4.4 21.1L8.35 19.3C9.5 19.75 10.72 20 12 20C17.25 20 21.5 16.2 21.5 11.5C21.5 6.8 17.25 3 12 3Z"
      fill="#1e293b"
      stroke="#fbbf24"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="9.2" cy="10.2" r="1.2" fill="#fbbf24" />
    <circle cx="14.8" cy="10.2" r="1.2" fill="#fbbf24" />
    <path
      d="M8.8 13.6C9.6 14.9 10.7 15.5 12 15.5C13.3 15.5 14.4 14.9 15.2 13.6"
      stroke="#fbbf24"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

export const EmoteBadgeIcon: React.FC<{ emoteId: EmoteId; className?: string }> = ({
  emoteId,
  className = 'w-6 h-6',
}) => {
  switch (emoteId) {
    case 'gg':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M7 5H17L15.4 12.2C14.9 14.2 13.6 15.4 12 15.4C10.4 15.4 9.1 14.2 8.6 12.2L7 5Z"
            fill="#fbbf24"
            stroke="#78350f"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M7 6.5H4.5C4.5 9.3 5.6 10.8 7.8 11.1M17 6.5H19.5C19.5 9.3 18.4 10.8 16.2 11.1"
            stroke="#fbbf24"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M12 15.5V19M8.5 19.5H15.5" stroke="#fbbf24" strokeWidth="2.1" strokeLinecap="round" />
        </svg>
      );
    case 'smile':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="#34d399" stroke="#064e3b" strokeWidth="1.8" />
          <path
            d="M8.3 10.3C8.8 9.2 10 9.2 10.5 10.3M13.5 10.3C14 9.2 15.2 9.2 15.7 10.3"
            stroke="#064e3b"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M8.3 13.6C9.2 15.4 10.5 16.2 12 16.2C13.5 16.2 14.8 15.4 15.7 13.6"
            stroke="#064e3b"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'nice':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M12 3L14.5 9.1L21 10.1L16.2 14.6L17.4 21L12 17.8L6.6 21L7.8 14.6L3 10.1L9.5 9.1L12 3Z"
            fill="#38bdf8"
            stroke="#082f49"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'angry':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12.5" r="8.8" fill="#fb7185" stroke="#881337" strokeWidth="1.8" />
          <path
            d="M7.8 9.6L11 11.3M16.2 9.6L13 11.3"
            stroke="#4c0519"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="9.2" cy="12.5" r="1.2" fill="#4c0519" />
          <circle cx="14.8" cy="12.5" r="1.2" fill="#4c0519" />
          <path
            d="M8.8 16.8C9.8 15.5 11 15 12 15C13 15 14.2 15.5 15.2 16.8"
            stroke="#4c0519"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'oops':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="#c084fc" stroke="#3b0764" strokeWidth="1.8" />
          <circle cx="9" cy="10" r="1.35" fill="#2e1065" />
          <circle cx="15" cy="10" r="1.35" fill="#2e1065" />
          <ellipse cx="12" cy="15.4" rx="2.2" ry="2.8" fill="#2e1065" />
        </svg>
      );
    case 'taunt':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M5 19L19 5M14 5H19V10M5 5L19 19M10 5H5V10"
            stroke="#f97316"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.5 17.5L17.5 6.5M6.5 6.5L17.5 17.5"
            stroke="#fde68a"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </svg>
      );
  }
};
