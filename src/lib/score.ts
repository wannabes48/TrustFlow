export type RiskKey = 'low' | 'medium' | 'high';

export interface ScoreBand {
  key: RiskKey;
  color: string;
  soft: string;
}

/** 0–40 high risk · 41–70 medium risk · 71–100 low risk */
export function scoreBand(score: number): ScoreBand {
  if (score >= 71) return { key: 'low', color: '#1fa971', soft: 'rgba(31,169,113,0.14)' };
  if (score >= 41) return { key: 'medium', color: '#e8a33d', soft: 'rgba(232,163,61,0.16)' };
  return { key: 'high', color: '#e0573f', soft: 'rgba(224,87,63,0.14)' };
}

export function formatKES(value: number): string {
  return `KES ${Math.round(value).toLocaleString('en-KE')}`;
}

export function formatMonth(key: string, lang: string): string {
  const [y, m] = key.split('-').map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString(lang === 'sw' ? 'sw-KE' : 'en-GB', {
    month: 'short',
    year: '2-digit',
  });
}
