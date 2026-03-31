'use client';

import type { SkillBreakdown, CEFRLevel } from '@/types';
import { CEFR_ORDER } from '@/types';

interface SkillRadarProps {
  skills: SkillBreakdown;
}

const SKILLS: { key: keyof SkillBreakdown; label: string }[] = [
  { key: 'speaking', label: 'Speaking' },
  { key: 'listening', label: 'Listening' },
  { key: 'reading', label: 'Reading' },
  { key: 'writing', label: 'Writing' },
  { key: 'grammar', label: 'Grammar' },
  { key: 'vocabulary', label: 'Vocabulary' },
];

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 95;
const LEVELS = 6; // A1 through C2
const LEVEL_LABELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function cefrToValue(level: CEFRLevel): number {
  return (CEFR_ORDER.indexOf(level) + 1) / LEVELS;
}

function polarToCartesian(
  angle: number,
  radius: number
): { x: number; y: number } {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

export default function SkillRadar({ skills }: SkillRadarProps) {
  const angleStep = 360 / SKILLS.length;

  const dataPoints = SKILLS.map((skill, i) => {
    const value = cefrToValue(skills[skill.key]);
    const angle = i * angleStep;
    return polarToCartesian(angle, RADIUS * value);
  });

  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="flex items-center justify-center">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="radar-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e58300" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#e58300" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Grid rings with CEFR labels */}
        {Array.from({ length: LEVELS }, (_, i) => {
          const r = (RADIUS * (i + 1)) / LEVELS;
          const points = SKILLS.map((_, j) => {
            const p = polarToCartesian(j * angleStep, r);
            return `${p.x},${p.y}`;
          }).join(' ');

          const labelPos = polarToCartesian(330, r);

          return (
            <g key={`ring-${i}`}>
              <polygon
                points={points}
                fill="none"
                stroke="#d1d5db"
                strokeWidth="0.75"
              />
              <text
                x={labelPos.x + 4}
                y={labelPos.y}
                textAnchor="start"
                dominantBaseline="central"
                fill="#3d6b6b" fillOpacity="0.5"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', fontWeight: 600 }}
              >
                {LEVEL_LABELS[i]}
              </text>
            </g>
          );
        })}

        {/* Axis lines */}
        {SKILLS.map((_, i) => {
          const p = polarToCartesian(i * angleStep, RADIUS);
          return (
            <line
              key={`axis-${i}`}
              x1={CENTER}
              y1={CENTER}
              x2={p.x}
              y2={p.y}
              stroke="#e5e7eb"
              strokeWidth="0.75"
            />
          );
        })}

        {/* Data area fill */}
        <path
          d={dataPath}
          fill="url(#radar-fill)"
          stroke="#e58300"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={`point-${i}`}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#e58300"
          />
        ))}

        {/* Labels */}
        {SKILLS.map((skill, i) => {
          const angle = i * angleStep;
          const labelRadius = RADIUS + 26;
          const p = polarToCartesian(angle, labelRadius);

          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
          if (p.x < CENTER - 10) textAnchor = 'end';
          else if (p.x > CENTER + 10) textAnchor = 'start';

          return (
            <g key={`label-${i}`}>
              <text
                x={p.x}
                y={p.y}
                textAnchor={textAnchor}
                dominantBaseline="central"
                fill="#3d6b6b"
                style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 500 }}
              >
                {skill.label}
              </text>
              <text
                x={p.x}
                y={p.y + 14}
                textAnchor={textAnchor}
                dominantBaseline="central"
                fill="#e58300"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                {skills[skill.key]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
