import { jsPDF } from 'jspdf';
import type { AnalysisResult } from '../components/Dashboard';
import { scoreBand } from './score';

type RGB = [number, number, number];

const FOREST: RGB = [15, 61, 46];
const INK: RGB = [11, 31, 23];
const LIME: RGB = [198, 243, 107];
const PAPER: RGB = [246, 243, 236];
const LINE: RGB = [221, 213, 196];
const MUTED: RGB = [102, 117, 109];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** jsPDF's core fonts are Latin-1 only; keep text safe. */
function safe(text: string) {
  return text.replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x00-\xFF]/g, '');
}

function kes(n: number) {
  return `KES ${Math.round(n).toLocaleString('en-KE')}`;
}

function drawArc(doc: jsPDF, cx: number, cy: number, r: number, from: number, to: number, color: RGB, width: number) {
  doc.setDrawColor(...color);
  doc.setLineWidth(width);
  doc.setLineCap('round');
  const step = 2;
  for (let a = from; a < to; a += step) {
    const b = Math.min(a + step, to);
    const ra = (a * Math.PI) / 180;
    const rb = (b * Math.PI) / 180;
    doc.line(cx + r * Math.cos(ra), cy + r * Math.sin(ra), cx + r * Math.cos(rb), cy + r * Math.sin(rb));
  }
}

export function buildCertificate(result: AnalysisResult, riskLabel: string): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 20;
  const score = Math.max(0, Math.min(100, Math.round(result.trustScore)));
  const band = hexToRgb(scoreBand(score).color);
  const issued = new Date();
  const ref = `TF-${issued.getTime().toString(36).toUpperCase()}`;

  // Page
  doc.setFillColor(...PAPER);
  doc.rect(0, 0, W, 297, 'F');

  // Header band
  doc.setFillColor(...FOREST);
  doc.rect(0, 0, W, 78, 'F');
  doc.setTextColor(...LIME);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TRUSTFLOW', M, 22, { charSpace: 1.2 });
  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'italic');
  doc.setFontSize(32);
  doc.text('Certificate of Financial Trust', M, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(190, 210, 200);
  doc.text(
    `Issued ${issued.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}   |   Ref ${ref}`,
    M,
    56,
  );
  doc.text('AI alternative credit assessment from mobile money activity', M, 63);

  // Score card
  const cardY = 92;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, cardY, W - M * 2, 78, 6, 6, 'FD');

  const cx = 62;
  const cy = cardY + 40;
  const r = 26;
  drawArc(doc, cx, cy, r, 135, 405, [236, 230, 217], 5);
  if (score > 0) drawArc(doc, cx, cy, r, 135, 135 + (270 * score) / 100, band, 5);
  doc.setTextColor(...INK);
  doc.setFont('times', 'normal');
  doc.setFontSize(40);
  doc.text(String(score), cx, cy + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('out of 100', cx, cy + 11, { align: 'center' });
  doc.setLineWidth(0.3);
  doc.setLineCap('butt');

  const rx = 104;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('RISK LEVEL', rx, cardY + 18, { charSpace: 0.6 });
  doc.setFillColor(...band);
  doc.circle(rx + 2, cardY + 26.2, 1.8, 'F');
  doc.setTextColor(...INK);
  doc.setFontSize(15);
  doc.text(safe(riskLabel), rx + 6, cardY + 28);

  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('SUGGESTED LOAN', rx, cardY + 44, { charSpace: 0.6 });
  doc.setFont('times', 'normal');
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  const loanLines = doc.splitTextToSize(safe(result.loanEligibility), W - M - rx - 6);
  doc.text(loanLines.slice(0, 3), rx, cardY + 52);

  // Summary
  const sY = 186;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('FINANCIAL SUMMARY', M, sY, { charSpace: 0.6 });
  const s = result.summary;
  const rows: [string, string][] = [
    ['Total income', kes(s.totalIncome)],
    ['Total expenses', kes(s.totalExpenses)],
    ['Net balance', kes(s.balance)],
    ['Transactions analysed', String(s.transactionCount)],
  ];
  const colW = (W - M * 2) / 4;
  rows.forEach(([label, value], i) => {
    const x = M + i * colW;
    doc.setDrawColor(...LINE);
    doc.line(x, sY + 5, x + colW - 4, sY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(label, x, sY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...INK);
    doc.text(value, x, sY + 19);
  });

  // Recommendation
  const recY = 220;
  const recLines = doc.splitTextToSize(safe(result.savingsRecommendation), W - M * 2 - 20);
  const recH = Math.min(14 + recLines.length * 6, 52);
  doc.setFillColor(...LIME);
  doc.roundedRect(M, recY, W - M * 2, recH, 5, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...FOREST);
  doc.text('SAVINGS RECOMMENDATION', M + 10, recY + 9, { charSpace: 0.6 });
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text(recLines.slice(0, 6), M + 10, recY + 16);

  // Footer
  doc.setDrawColor(...LINE);
  doc.line(M, 276, W - M, 276);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(
    doc.splitTextToSize(
      'This certificate is an AI-generated alternative credit assessment based on mobile money records submitted by the holder. ' +
        'TrustFlow does not store the underlying data. Lenders should use it alongside their own checks.',
      W - M * 2,
    ),
    M,
    282,
  );

  return doc;
}

export function downloadCertificate(result: AnalysisResult, riskLabel: string) {
  const score = Math.max(0, Math.min(100, Math.round(result.trustScore)));
  buildCertificate(result, riskLabel).save(`TrustFlow_Certificate_${score}.pdf`);
}
