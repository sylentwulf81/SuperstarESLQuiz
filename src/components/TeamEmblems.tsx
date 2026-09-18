import React from 'react';
import { CharacterId } from '../types';

export const YoshiEmblem: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  const clipId = React.useId();
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={clipId}>
          <ellipse cx="100" cy="100" rx="58" ry="67" transform="rotate(28 100 100)" />
        </clipPath>
      </defs>
      <rect width="200" height="200" fill="#6AB82D" />
      <circle cx="100" cy="100" r="78" fill="#FFFFFF" />
      <g>
        <g clipPath={`url(#${clipId})`}>
          <rect x="0" y="0" width="200" height="200" fill="#FFFFFF" />
          <circle cx="112" cy="62" r="32" fill="#6AB82D" />
          <circle cx="114" cy="128" r="29" fill="#6AB82D" />
          <circle cx="48" cy="100" r="31" fill="#6AB82D" />
        </g>
        <ellipse
          cx="100"
          cy="100"
          rx="58"
          ry="67"
          transform="rotate(28 100 100)"
          fill="none"
          stroke="#171212"
          strokeWidth="7"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

export const MarioEmblem: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#E50014" />
    <circle cx="100" cy="100" r="76" fill="#FFFFFF" />
    <path
      d="M 42 140 L 68 46 L 100 106 L 132 46 L 158 140 L 132 140 L 120 86 L 100 118 L 80 86 L 68 140 Z"
      fill="#E50014"
      stroke="#E50014"
      strokeWidth="4"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

export const PeachEmblem: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#EA629F" />
    <circle cx="100" cy="100" r="78" fill="#FFFFFF" />
    <g id="crown">
      <polygon
        points="56,152 144,152 144,136 158,64 121,105 100,37 79,105 42,64 56,136"
        fill="#FFE600"
        stroke="#E67300"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <line x1="56" y1="124" x2="144" y2="124" stroke="#E67300" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="53" cy="120" rx="12" ry="16" fill="#00A2E8" stroke="#005B96" strokeWidth="4.5" />
      <ellipse cx="147" cy="120" rx="12" ry="16" fill="#00A2E8" stroke="#005B96" strokeWidth="4.5" />
      <ellipse cx="100" cy="120" rx="15" ry="18" fill="#D30B1C" stroke="#7A1322" strokeWidth="5" />
    </g>
  </svg>
);

export const DaisyEmblem: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#F37B12" />
    <circle cx="100" cy="100" r="76" fill="#FFFFFF" />
    <g stroke="#F37B12" strokeWidth="6" fill="#FFDE00" strokeLinejoin="round">
      <circle cx="100" cy="62" r="23" />
      <circle cx="133" cy="81" r="23" />
      <circle cx="133" cy="119" r="23" />
      <circle cx="100" cy="138" r="23" />
      <circle cx="67" cy="119" r="23" />
      <circle cx="67" cy="81" r="23" />
      <circle cx="100" cy="100" r="28" stroke="none" fill="#FFDE00" />
    </g>
    <circle cx="100" cy="100" r="33" fill="#52C4AE" stroke="#0C8E77" strokeWidth="6" />
  </svg>
);

export const DonkeyKongEmblem: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#FFD600" />
    <circle cx="100" cy="100" r="76" fill="#D70014" />
    <g transform="translate(100, 100) scale(0.85) translate(-100, -100)">
      <path
        d="M 46 62 L 90 58 C 108 58, 120 72, 120 98 C 120 126, 106 142, 86 142 L 46 142 Z"
        fill="#FFEA00"
        stroke="#D70014"
        strokeWidth="9"
        strokeLinejoin="round"
      />
      <path
        d="M 68 82 L 86 82 C 94 82, 98 90, 98 100 C 98 112, 92 118, 84 118 L 68 118 Z"
        fill="#D70014"
      />
      <path
        d="M 106 60 L 128 60 L 128 92 L 152 60 L 178 60 L 142 102 L 180 142 L 152 142 L 128 112 L 128 142 L 106 142 Z"
        fill="#FFEA00"
        stroke="#D70014"
        strokeWidth="9"
        strokeLinejoin="round"
      />
      <path
        d="M 46 62 L 90 58 C 108 58, 120 72, 120 98 C 120 126, 106 142, 86 142 L 46 142 Z"
        fill="none"
        stroke="#FFF275"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M 106 60 L 128 60 L 128 92 L 152 60 L 178 60 L 142 102 L 180 142 L 152 142 L 128 112 L 128 142 L 106 142 Z"
        fill="none"
        stroke="#FFF275"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

export const LuigiEmblem: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#00A644" />
    <circle cx="100" cy="100" r="76" fill="#FFFFFF" />
    <path
      d="M 64 46 L 92 42 L 92 116 L 138 116 L 138 142 L 64 142 Z"
      fill="#00A644"
      stroke="#00A644"
      strokeWidth="4"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

export const TeamEmblem: React.FC<{ characterId: CharacterId; className?: string }> = ({
  characterId,
  className = 'w-full h-full',
}) => {
  switch (characterId) {
    case 'yoshi':
      return <YoshiEmblem className={className} />;
    case 'mario':
      return <MarioEmblem className={className} />;
    case 'peach':
      return <PeachEmblem className={className} />;
    case 'daisy':
      return <DaisyEmblem className={className} />;
    case 'donkey_kong':
      return <DonkeyKongEmblem className={className} />;
    case 'luigi':
      return <LuigiEmblem className={className} />;
    default:
      return <span className="select-none leading-none">🎮</span>;
  }
};
