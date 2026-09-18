import React from 'react';
import { GameTheme } from '../types';

interface ThemedBackdropProps {
  theme: GameTheme;
}

export const ThemedBackdrop: React.FC<ThemedBackdropProps> = ({ theme }) => {
  if (theme === 'summer') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {/* Full-bleed responsive cartoony Nintendo-style Summer Landscape SVG */}
        <svg
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full object-cover"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Sky Gradient */}
            <linearGradient id="summerSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e88e5" />
              <stop offset="35%" stopColor="#42a5f5" />
              <stop offset="70%" stopColor="#90caf9" />
              <stop offset="100%" stopColor="#ffe082" />
            </linearGradient>

            {/* Sun Glow */}
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff9c4" stopOpacity="1" />
              <stop offset="40%" stopColor="#fdd835" stopOpacity="0.9" />
              <stop offset="75%" stopColor="#f57c00" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ff9800" stopOpacity="0" />
            </radialGradient>

            {/* Ocean Gradient */}
            <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00b0ff" />
              <stop offset="45%" stopColor="#0091ea" />
              <stop offset="100%" stopColor="#006064" />
            </linearGradient>

            {/* Sand Shore Gradient */}
            <linearGradient id="sandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffe082" />
              <stop offset="50%" stopColor="#ffca28" />
              <stop offset="100%" stopColor="#ffa000" />
            </linearGradient>

            {/* Distant Mountain Gradient */}
            <linearGradient id="distMountain" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7986cb" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#3f51b5" stopOpacity="0.85" />
            </linearGradient>

            {/* Green Hill Gradient 1 */}
            <linearGradient id="hillGreen1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#81c784" />
              <stop offset="60%" stopColor="#43a047" />
              <stop offset="100%" stopColor="#2e7d32" />
            </linearGradient>

            {/* Green Hill Gradient 2 (Front) */}
            <linearGradient id="hillGreen2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#aed581" />
              <stop offset="50%" stopColor="#7cb342" />
              <stop offset="100%" stopColor="#33691e" />
            </linearGradient>

            {/* Cloud Gradient */}
            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="85%" stopColor="#f5f5f5" />
              <stop offset="100%" stopColor="#e0e0e0" />
            </linearGradient>

            {/* Palm Trunk Pattern / Grad */}
            <linearGradient id="palmTrunk" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8d6e63" />
              <stop offset="50%" stopColor="#a1887f" />
              <stop offset="100%" stopColor="#5d4037" />
            </linearGradient>

            <linearGradient id="palmFrond" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a5d6a7" />
              <stop offset="40%" stopColor="#4caf50" />
              <stop offset="100%" stopColor="#1b5e20" />
            </linearGradient>
          </defs>

          {/* Sky Rectangle */}
          <rect width="1920" height="1080" fill="url(#summerSky)" />

          {/* Sun Rays */}
          <g opacity="0.3" transform="translate(1550, 180)">
            {Array.from({ length: 12 }).map((_, i) => (
              <polygon
                key={i}
                points="0,0 -80,-800 80,-800"
                fill="#fff9c4"
                transform={`rotate(${i * 30})`}
              />
            ))}
          </g>

          {/* Bright Cartoon Sun */}
          <circle cx="1550" cy="180" r="160" fill="url(#sunGlow)" />
          <circle cx="1550" cy="180" r="75" fill="#fff59d" stroke="#fbc02d" strokeWidth="6" />

          {/* Cute Floating Mario-Style Clouds */}
          <g opacity="0.92">
            {/* Cloud 1 (Left high) */}
            <g transform="translate(180, 120)">
              <ellipse cx="70" cy="45" rx="55" ry="35" fill="url(#cloudGrad)" />
              <ellipse cx="125" cy="35" rx="45" ry="35" fill="url(#cloudGrad)" />
              <ellipse cx="170" cy="45" rx="50" ry="35" fill="url(#cloudGrad)" />
              <rect x="35" y="45" width="170" height="30" rx="15" fill="url(#cloudGrad)" />
            </g>

            {/* Cloud 2 (Mid sky) */}
            <g transform="translate(720, 90) scale(1.15)">
              <ellipse cx="70" cy="45" rx="55" ry="35" fill="url(#cloudGrad)" />
              <ellipse cx="130" cy="30" rx="50" ry="40" fill="url(#cloudGrad)" />
              <ellipse cx="185" cy="45" rx="50" ry="35" fill="url(#cloudGrad)" />
              <rect x="35" y="45" width="185" height="32" rx="16" fill="url(#cloudGrad)" />
            </g>

            {/* Cloud 3 (Right) */}
            <g transform="translate(1260, 160) scale(0.85)">
              <ellipse cx="70" cy="45" rx="55" ry="35" fill="url(#cloudGrad)" />
              <ellipse cx="120" cy="35" rx="45" ry="35" fill="url(#cloudGrad)" />
              <ellipse cx="165" cy="45" rx="48" ry="35" fill="url(#cloudGrad)" />
              <rect x="35" y="45" width="165" height="28" rx="14" fill="url(#cloudGrad)" />
            </g>
          </g>

          {/* Distant Stylized Island Mountains */}
          <path
            d="M 100,680 Q 280,480 480,680 T 880,680 T 1280,680 T 1700,680 L 1920,740 L 1920,1080 L 0,1080 Z"
            fill="url(#distMountain)"
          />
          <polygon points="460,540 480,480 500,540" fill="#c5cae9" opacity="0.6" />
          <polygon points="860,560 880,510 900,560" fill="#c5cae9" opacity="0.6" />

          {/* Midground Cartoon Green Rolling Hills (Super Mario World style) */}
          <path
            d="M -50,780 Q 250,560 580,780 T 1200,760 T 1800,750 Q 1900,750 2000,780 L 2000,1080 L -50,1080 Z"
            fill="url(#hillGreen1)"
          />

          {/* Mario-style eyes on distant hill */}
          <g transform="translate(420, 680)">
            <ellipse cx="0" cy="0" rx="6" ry="12" fill="#1b5e20" />
            <ellipse cx="1" cy="-2" rx="2" ry="5" fill="#ffffff" />
            <ellipse cx="20" cy="0" rx="6" ry="12" fill="#1b5e20" />
            <ellipse cx="21" cy="-2" rx="2" ry="5" fill="#ffffff" />
          </g>

          {/* Turquoise Tropical Ocean Waters with Rolling Surf */}
          <path
            d="M 0,820 Q 300,790 640,825 T 1280,820 T 1920,815 L 1920,960 L 0,960 Z"
            fill="url(#oceanGrad)"
          />
          {/* Cartoon Ocean Wave White Crests */}
          <path
            d="M 0,825 Q 160,815 320,825 T 640,825 T 960,825 T 1280,825 T 1600,825 T 1920,825"
            fill="none"
            stroke="#e0f7fa"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M 0,865 Q 180,855 360,865 T 720,865 T 1080,865 T 1440,865 T 1800,865 T 1920,865"
            fill="none"
            stroke="#80deea"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Foreground Golden Sand Shore & Front Green Dunes */}
          <path
            d="M -50,910 Q 320,850 780,905 T 1540,890 Q 1760,885 2000,920 L 2000,1080 L -50,1080 Z"
            fill="url(#sandGrad)"
          />
          <path
            d="M -30,960 Q 280,890 680,960 T 1420,950 Q 1720,940 1980,980 L 1980,1080 L -30,1080 Z"
            fill="url(#hillGreen2)"
          />

          {/* Mario-style eyes on foreground hill */}
          <g transform="translate(1320, 960)">
            <ellipse cx="0" cy="0" rx="7" ry="14" fill="#1b5e20" />
            <ellipse cx="1.5" cy="-3" rx="2.5" ry="6" fill="#ffffff" />
            <ellipse cx="24" cy="0" rx="7" ry="14" fill="#1b5e20" />
            <ellipse cx="25.5" cy="-3" rx="2.5" ry="6" fill="#ffffff" />
          </g>

          {/* Tropical Palm Tree (Left foreground) */}
          <g transform="translate(120, 980)">
            {/* Curved Trunk */}
            <path
              d="M 0,0 Q 40,-130 15,-270 Q 2,-320 -15,-360"
              fill="none"
              stroke="url(#palmTrunk)"
              strokeWidth="28"
              strokeLinecap="round"
            />
            {/* Trunk segments */}
            <circle cx="15" cy="-140" r="15" fill="#4e342e" opacity="0.3" />
            <circle cx="20" cy="-210" r="14" fill="#4e342e" opacity="0.3" />
            <circle cx="0" cy="-280" r="13" fill="#4e342e" opacity="0.3" />

            {/* Coconuts */}
            <circle cx="-25" cy="-365" r="14" fill="#4e342e" />
            <circle cx="-5" cy="-360" r="13" fill="#5d4037" />
            <circle cx="-18" cy="-348" r="12" fill="#3e2723" />

            {/* Palm Fronds */}
            <g transform="translate(-15, -360)">
              {/* Frond 1 (Top left) */}
              <path d="M 0,0 Q -80,-80 -160,-50 Q -90,-20 0,0" fill="url(#palmFrond)" stroke="#2e7d32" strokeWidth="2" />
              {/* Frond 2 (Left) */}
              <path d="M 0,0 Q -110,-20 -180,50 Q -90,40 0,0" fill="url(#palmFrond)" stroke="#2e7d32" strokeWidth="2" />
              {/* Frond 3 (Top right) */}
              <path d="M 0,0 Q 60,-100 140,-70 Q 80,-30 0,0" fill="url(#palmFrond)" stroke="#2e7d32" strokeWidth="2" />
              {/* Frond 4 (Right) */}
              <path d="M 0,0 Q 110,-40 170,20 Q 90,20 0,0" fill="url(#palmFrond)" stroke="#2e7d32" strokeWidth="2" />
              {/* Frond 5 (Right down) */}
              <path d="M 0,0 Q 80,40 130,90 Q 60,60 0,0" fill="url(#palmFrond)" stroke="#2e7d32" strokeWidth="2" />
              {/* Frond 6 (Upward crest) */}
              <path d="M 0,0 Q -20,-110 0,-160 Q 20,-110 0,0" fill="url(#palmFrond)" stroke="#2e7d32" strokeWidth="2" />
            </g>
          </g>

          {/* Second Smaller Palm Tree (Right midground) */}
          <g transform="translate(1780, 930) scale(0.75)">
            <path
              d="M 0,0 Q -30,-110 -10,-240 Q 5,-290 20,-340"
              fill="none"
              stroke="url(#palmTrunk)"
              strokeWidth="24"
              strokeLinecap="round"
            />
            {/* Palm Fronds */}
            <g transform="translate(20, -340)">
              <path d="M 0,0 Q -80,-70 -150,-40 Q -80,-15 0,0" fill="url(#palmFrond)" stroke="#2e7d32" strokeWidth="2" />
              <path d="M 0,0 Q -90,0 -150,60 Q -70,40 0,0" fill="url(#palmFrond)" stroke="#2e7d32" strokeWidth="2" />
              <path d="M 0,0 Q 60,-90 130,-60 Q 70,-20 0,0" fill="url(#palmFrond)" stroke="#2e7d32" strokeWidth="2" />
              <path d="M 0,0 Q 90,-20 150,30 Q 70,30 0,0" fill="url(#palmFrond)" stroke="#2e7d32" strokeWidth="2" />
              <path d="M 0,0 Q 0,-100 15,-150 Q 25,-100 0,0" fill="url(#palmFrond)" stroke="#2e7d32" strokeWidth="2" />
            </g>
          </g>
        </svg>

        {/* Ambient Warm Color Tint Overlay for high contrast UI */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#061833]/65 via-[#081c3b]/55 to-[#040f21]/80" />
      </div>
    );
  }

  // Winter / Christmas Edition Backdrop
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Full-bleed responsive cartoony Nintendo-style Winter Landscape SVG */}
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full object-cover"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Winter Twilight Sky Gradient */}
          <linearGradient id="winterSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a1026" />
            <stop offset="40%" stopColor="#121e42" />
            <stop offset="75%" stopColor="#1e3264" />
            <stop offset="100%" stopColor="#2b4885" />
          </linearGradient>

          {/* Glowing Moon Gradient */}
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffde7" stopOpacity="1" />
            <stop offset="45%" stopColor="#fff59d" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#80deea" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </radialGradient>

          {/* Aurora Borealis Ribbon 1 */}
          <linearGradient id="auroraGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0" />
            <stop offset="30%" stopColor="#1de9b6" stopOpacity="0.5" />
            <stop offset="65%" stopColor="#76ff03" stopOpacity="0.45" />
            <stop offset="90%" stopColor="#b388ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7c4dff" stopOpacity="0" />
          </linearGradient>

          {/* Distant Icy Mountain Gradient */}
          <linearGradient id="distIceMountain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#b0bec5" />
            <stop offset="100%" stopColor="#263238" />
          </linearGradient>

          {/* Snow Mountain Gradient */}
          <linearGradient id="snowMountain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e1f5fe" />
            <stop offset="40%" stopColor="#90caf9" />
            <stop offset="100%" stopColor="#1a237e" />
          </linearGradient>

          {/* Rolling Snow Hill 1 */}
          <linearGradient id="snowHill1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#b3e5fc" />
            <stop offset="100%" stopColor="#1565c0" />
          </linearGradient>

          {/* Rolling Snow Hill 2 (Foreground) */}
          <linearGradient id="snowHill2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fdff" />
            <stop offset="60%" stopColor="#81d4fa" />
            <stop offset="100%" stopColor="#0d47a1" />
          </linearGradient>

          {/* Pine Tree Trunk */}
          <linearGradient id="pineWood" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3e2723" />
            <stop offset="100%" stopColor="#5d4037" />
          </linearGradient>

          {/* Pine Tree Needles */}
          <linearGradient id="pineNeedles" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2e7d32" />
            <stop offset="70%" stopColor="#1b5e20" />
            <stop offset="100%" stopColor="#0d3311" />
          </linearGradient>

          {/* Warm Lantern Glow */}
          <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff9c4" stopOpacity="1" />
            <stop offset="50%" stopColor="#ffb300" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ff6f00" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Night Sky */}
        <rect width="1920" height="1080" fill="url(#winterSky)" />

        {/* Twinkling Nintendo Stars */}
        <g fill="#ffffff" opacity="0.85">
          {/* Classic 4-point stars */}
          {[
            [120, 80, 5], [260, 140, 3], [420, 60, 4], [580, 160, 3],
            [750, 90, 6], [900, 150, 4], [1080, 70, 5], [1240, 130, 3],
            [1420, 80, 5], [1680, 110, 4], [1820, 60, 6], [1740, 190, 3],
            [320, 220, 3], [850, 230, 4], [1350, 210, 3],
          ].map(([x, y, r], idx) => (
            <g key={idx} transform={`translate(${x}, ${y})`}>
              <circle cx="0" cy="0" r={r} />
              <line x1={-r * 2} y1="0" x2={r * 2} y2="0" stroke="#ffffff" strokeWidth="1" />
              <line x1="0" y1={-r * 2} x2="0" y2={r * 2} stroke="#ffffff" strokeWidth="1" />
            </g>
          ))}
        </g>

        {/* Aurora Borealis Ribbon Waves */}
        <path
          d="M 0,220 Q 380,120 820,200 T 1620,160 Q 1780,180 1920,240 L 1920,380 Q 1580,280 1140,320 T 380,340 L 0,380 Z"
          fill="url(#auroraGrad1)"
          opacity="0.6"
        />
        <path
          d="M 100,160 Q 560,90 1020,180 T 1840,150 L 1920,280 Q 1460,220 920,270 T 0,260 L 0,220 Z"
          fill="url(#auroraGrad1)"
          opacity="0.4"
        />

        {/* Luminous Winter Moon with Mario Glow */}
        <circle cx="1600" cy="190" r="140" fill="url(#moonGlow)" />
        <circle cx="1600" cy="190" r="65" fill="#fffde7" stroke="#fff9c4" strokeWidth="4" />
        <circle cx="1575" cy="180" r="12" fill="#fff59d" opacity="0.5" />
        <circle cx="1615" cy="210" r="16" fill="#fff59d" opacity="0.4" />
        <circle cx="1625" cy="165" r="9" fill="#fff59d" opacity="0.4" />

        {/* Distant Majestic Snow Peaks (Nintendo style) */}
        <polygon points="180,680 340,390 520,680" fill="url(#snowMountain)" />
        <polygon points="340,390 300,480 340,460 380,480" fill="#ffffff" />

        <polygon points="460,700 680,340 920,700" fill="url(#distIceMountain)" />
        {/* Crisp White Mountain Snowcap */}
        <polygon points="680,340 610,470 650,450 680,480 720,440 760,470" fill="#ffffff" />

        <polygon points="860,680 1060,420 1280,680" fill="url(#snowMountain)" />
        <polygon points="1060,420 1010,500 1060,480 1110,510" fill="#ffffff" />

        <polygon points="1220,700 1440,360 1680,700" fill="url(#distIceMountain)" />
        <polygon points="1440,360 1370,490 1420,460 1450,490 1490,460 1530,490" fill="#ffffff" />

        {/* Midground Rolling Snow Hills */}
        <path
          d="M -50,780 Q 320,610 740,760 T 1520,740 Q 1740,730 2000,770 L 2000,1080 L -50,1080 Z"
          fill="url(#snowHill1)"
        />

        {/* Cute Mario Eyes on Snow Hill */}
        <g transform="translate(680, 720)">
          <ellipse cx="0" cy="0" rx="6" ry="12" fill="#0d47a1" />
          <ellipse cx="1" cy="-2" rx="2" ry="5" fill="#ffffff" />
          <ellipse cx="20" cy="0" rx="6" ry="12" fill="#0d47a1" />
          <ellipse cx="21" cy="-2" rx="2" ry="5" fill="#ffffff" />
        </g>

        {/* Midground Snow-dusted Pine Forest Grouping (Left) */}
        {[
          [180, 720, 0.85],
          [260, 740, 1.05],
          [350, 715, 0.75],
          [1360, 725, 0.9],
          [1450, 710, 0.75],
        ].map(([x, y, s], idx) => (
          <g key={idx} transform={`translate(${x}, ${y}) scale(${s})`}>
            {/* Trunk */}
            <rect x="-8" y="20" width="16" height="50" fill="url(#pineWood)" rx="4" />
            {/* Tier 3 (Bottom) */}
            <polygon points="0,-20 -70,35 70,35" fill="url(#pineNeedles)" />
            <path d="M -70,35 Q -35,15 0,25 Q 35,15 70,35 L 55,20 Q 20,5 0,10 Q -20,5 -55,20 Z" fill="#ffffff" />
            {/* Tier 2 (Mid) */}
            <polygon points="0,-60 -55,-10 55,-10" fill="url(#pineNeedles)" />
            <path d="M -55,-10 Q -25,-25 0,-18 Q 25,-25 55,-10 L 40,-25 Q 20,-35 0,-30 Q -20,-35 -40,-25 Z" fill="#ffffff" />
            {/* Tier 1 (Top) */}
            <polygon points="0,-100 -40,-50 40,-50" fill="url(#pineNeedles)" />
            <polygon points="0,-100 -18,-70 0,-65 18,-70" fill="#ffffff" />
          </g>
        ))}

        {/* Foreground Rolling Snow Hill */}
        <path
          d="M -30,880 Q 380,780 820,870 T 1640,860 Q 1860,850 2000,890 L 2000,1080 L -30,1080 Z"
          fill="url(#snowHill2)"
        />

        {/* Foreground Pine Trees with Cozy Glowing Lantern */}
        <g transform="translate(160, 890) scale(1.2)">
          <rect x="-10" y="20" width="20" height="60" fill="url(#pineWood)" rx="5" />
          <polygon points="0,-20 -80,45 80,45" fill="url(#pineNeedles)" />
          <path d="M -80,45 Q -40,20 0,30 Q 40,20 80,45 L 60,25 Q 20,8 0,15 Q -20,8 -60,25 Z" fill="#ffffff" />

          <polygon points="0,-65 -65,-5 65,-5" fill="url(#pineNeedles)" />
          <path d="M -65,-5 Q -30,-25 0,-15 Q 30,-25 65,-5 L 50,-20 Q 20,-35 0,-25 Q -20,-35 -50,-20 Z" fill="#ffffff" />

          <polygon points="0,-110 -45,-50 45,-50" fill="url(#pineNeedles)" />
          <polygon points="0,-110 -22,-75 0,-70 22,-75" fill="#ffffff" />

          {/* Yellow Star Topper */}
          <polygon
            points="0,-125 4,-115 14,-115 6,-108 9,-98 0,-104 -9,-98 -6,-108 -14,-115 -4,-115"
            fill="#ffd600"
            stroke="#ffab00"
            strokeWidth="1.5"
          />

          {/* Cozy Holiday Lantern hanging on branch */}
          <g transform="translate(45, 10)">
            <circle cx="0" cy="0" r="30" fill="url(#lanternGlow)" />
            <rect x="-5" y="-8" width="10" height="16" rx="2" fill="#ffb300" stroke="#424242" strokeWidth="1.5" />
            <line x1="0" y1="-12" x2="0" y2="-8" stroke="#424242" strokeWidth="1.5" />
          </g>
        </g>

        {/* Foreground Pine Tree Right */}
        <g transform="translate(1780, 870) scale(1.15)">
          <rect x="-9" y="20" width="18" height="50" fill="url(#pineWood)" rx="4" />
          <polygon points="0,-20 -75,40 75,40" fill="url(#pineNeedles)" />
          <polygon points="0,-65 -60,-8 60,-8" fill="url(#pineNeedles)" />
          <polygon points="0,-105 -42,-50 42,-50" fill="url(#pineNeedles)" />
          <polygon points="0,-105 -20,-75 0,-70 20,-75" fill="#ffffff" />

          {/* Cozy Lantern on right tree */}
          <g transform="translate(-40, 8)">
            <circle cx="0" cy="0" r="28" fill="url(#lanternGlow)" />
            <rect x="-5" y="-8" width="10" height="16" rx="2" fill="#ffb300" stroke="#424242" strokeWidth="1.5" />
          </g>
        </g>
      </svg>

      {/* Ambient Cool Twilight Color Overlay for high contrast UI */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#091026]/70 via-[#0b1636]/60 to-[#060a17]/85" />
    </div>
  );
};
