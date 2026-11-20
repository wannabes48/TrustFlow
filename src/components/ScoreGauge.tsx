import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { scoreBand } from '../lib/score';

const START = 135;
const SWEEP = 270;

function polar(c: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return [c + r * Math.cos(a), c + r * Math.sin(a)];
}

function arcPath(c: number, r: number, from: number, to: number) {
  const [x1, y1] = polar(c, r, from);
  const [x2, y2] = polar(c, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

export function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

interface ScoreGaugeProps {
  score: number | null;
  size?: number;
  stroke?: number;
  track?: string;
  tickColor?: string;
  spinning?: boolean;
  children?: React.ReactNode;
}

/** 270° arc gauge with band thresholds marked at 40 and 70. */
export function ScoreGauge({
  score,
  size = 220,
  stroke = 14,
  track = 'rgba(15,61,46,0.10)',
  tickColor = 'rgba(15,61,46,0.35)',
  spinning = false,
  children,
}: ScoreGaugeProps) {
  const c = size / 2;
  const r = c - stroke / 2 - 10;
  const full = arcPath(c, r, START, START + SWEEP);
  const color = score === null ? 'transparent' : scoreBand(score).color;

  const ticks = [40, 70].map((v) => {
    const deg = START + (SWEEP * v) / 100;
    const [x1, y1] = polar(c, r + stroke / 2 + 3, deg);
    const [x2, y2] = polar(c, r + stroke / 2 + 9, deg);
    return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tickColor} strokeWidth={2} strokeLinecap="round" />;
  });

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <path d={full} fill="none" stroke={track} strokeWidth={stroke} strokeLinecap="round" />
        {ticks}
        {spinning ? (
          <motion.path
            d={full}
            fill="none"
            stroke="#c6f36b"
            strokeWidth={stroke}
            strokeLinecap="round"
            initial={{ pathLength: 0.08, pathOffset: 0 }}
            animate={{ pathOffset: [0, 0.92, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : (
          score !== null && (
            <motion.path
              key={score}
              d={full}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: Math.max(score, 1) / 100 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            />
          )
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
