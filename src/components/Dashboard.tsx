import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  ArrowLeft, ArrowRight, AlertTriangle, Check, Download, Lock, PiggyBank, RotateCcw, Sparkles,
  TrendingDown, TrendingUp, Wallet, Receipt, X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatKES, formatMonth, scoreBand } from '../lib/score';
import { Language, Strings } from '../translations';
import { Logo, LangToggle } from './Brand';
import { ScoreGauge, useCountUp } from './ScoreGauge';

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryData {
  name: string;
  value: number;
}

export interface AnalysisResult {
  trustScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  loanEligibility: string;
  savingsRecommendation: string;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
  };
  categories: CategoryData[];
}

const CATEGORY_COLORS = ['#0f3d2e', '#1fa971', '#e8a33d', '#e0573f', '#8fbf4a', '#9aa69f'];

const tooltipStyle = {
  borderRadius: 14,
  border: '1px solid #ddd5c4',
  background: '#ffffff',
  boxShadow: '0 12px 30px -12px rgba(15,61,46,0.25)',
  fontSize: 12,
  padding: '8px 12px',
};

interface DashboardProps {
  t: Strings;
  lang: Language;
  setLang: (l: Language) => void;
  onHome: () => void;
  inputText: string;
  setInputText: (v: string) => void;
  onLoadSample: () => void;
  onAnalyze: () => void;
  onReset: () => void;
  onDownload: () => void;
  isAnalyzing: boolean;
  error: string | null;
  result: AnalysisResult | null;
  chartData: MonthlyData[];
}

function riskLabel(t: Strings, score: number) {
  const k = scoreBand(score).key;
  return k === 'low' ? t.lowRisk : k === 'medium' ? t.mediumRisk : t.highRisk;
}

/* ───────────────────────── Input panel ───────────────────────── */

function InputPanel(p: DashboardProps) {
  const lineCount = p.inputText.trim() ? p.inputText.trim().split(/\n+/).length : 0;
  return (
    <div className="lg:sticky lg:top-24 rounded-[28px] bg-white border border-line p-5 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-extrabold">{p.t.dataInput}</h2>
        <span className="font-mono text-[11px] text-muted">01</span>
      </div>
      <p className="text-sm text-muted mb-4">{p.t.inputHelp}</p>

      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted mr-1">{p.t.worksWith}</span>
        {['M-Pesa SMS', 'CSV', 'Text'].map((f) => (
          <span key={f} className="rounded-full bg-sand px-2.5 py-1 text-[11px] font-bold text-forest">
            {f}
          </span>
        ))}
      </div>

      <div className="relative rounded-2xl border border-line bg-paper focus-within:border-forest focus-within:ring-4 focus-within:ring-leaf/15 transition-all">
        <textarea
          className="block w-full h-64 sm:h-72 p-4 text-[12.5px] leading-relaxed font-mono bg-transparent outline-none resize-none placeholder:text-muted/60"
          value={p.inputText}
          onChange={(e) => p.setInputText(e.target.value)}
          placeholder={'QW12345678 Confirmed. You have received Ksh 5,000 from…\n\nDate,Amount,Type\n2026-03-01,500,IN'}
          spellCheck={false}
          aria-label={p.t.dataInput}
        />
        <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[11px] text-muted">
          <span className="font-mono tabular">
            {lineCount} {p.t.lines}
          </span>
          {p.inputText && (
            <button
              onClick={() => p.setInputText('')}
              className="inline-flex items-center gap-1 font-bold hover:text-coral transition-colors"
            >
              <X className="w-3 h-3" /> {p.t.clear}
            </button>
          )}
        </div>
      </div>

      <button
        onClick={p.onLoadSample}
        className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-forest/30 py-3 text-sm font-bold text-forest hover:bg-sand/60 transition-colors"
      >
        <Sparkles className="w-4 h-4 text-leaf" />
        {p.t.loadSample}
      </button>

      <button
        onClick={p.onAnalyze}
        disabled={p.isAnalyzing || !p.inputText.trim()}
        className="group mt-3 w-full inline-flex items-center justify-between rounded-2xl bg-forest text-white pl-5 pr-2 py-2 text-base font-bold hover:bg-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {p.t.analyzeBtn}
        <span className="grid place-items-center w-10 h-10 rounded-xl bg-lime text-ink transition-transform group-enabled:group-hover:translate-x-0.5">
          <ArrowRight className="w-5 h-5" />
        </span>
      </button>

      <AnimatePresence>
        {p.error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-3.5 rounded-2xl bg-coral/10 text-[#9e3523] text-sm flex items-start gap-2 border border-coral/20">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{p.error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5 flex items-start gap-2 text-xs text-muted leading-relaxed">
        <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-leaf" />
        {p.t.privacyBadge}
      </div>
    </div>
  );
}

/* ───────────────────────── States ───────────────────────── */

function EmptyState({ t }: { t: Strings }) {
  const steps = [t.step1Title, t.step2Title, t.step3Title];
  return (
    <div className="min-h-[520px] rounded-[28px] border border-dashed border-line bg-white/50 flex flex-col items-center justify-center p-8 text-center">
      <ScoreGauge score={null}>
        <span className="font-display text-6xl text-line leading-none">—</span>
        <span className="text-xs text-muted mt-1">{t.outOf}</span>
      </ScoreGauge>
      <h3 className="font-display text-3xl mt-2">{t.readyTitle}</h3>
      <p className="text-muted max-w-sm mt-2">{t.readyDesc}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {steps.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-muted">
            <span className="font-mono text-leaf">0{i + 1}</span> {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function LoadingState({ t }: { t: Strings }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, t.loadingSteps.length - 1)), 1700);
    return () => clearInterval(id);
  }, [t.loadingSteps.length]);

  return (
    <div className="min-h-[520px] rounded-[28px] bg-forest text-white relative overflow-hidden flex flex-col items-center justify-center p-8">
      <div className="absolute inset-0 grid-lines" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] rounded-full bg-leaf/20 blur-3xl" />
      <div className="relative flex flex-col items-center">
        <ScoreGauge score={null} spinning track="rgba(255,255,255,0.08)" tickColor="rgba(255,255,255,0.3)">
          <Sparkles className="w-8 h-8 text-lime animate-pulse" />
        </ScoreGauge>
        <h3 className="font-display text-3xl mt-2 text-center">{t.analyzing}</h3>
        <ul className="mt-7 space-y-2.5 w-full max-w-xs">
          {t.loadingSteps.map((s, i) => (
            <li
              key={i}
              className={cn(
                'flex items-center gap-3 text-sm transition-opacity duration-500',
                i <= step ? 'opacity-100' : 'opacity-30',
              )}
            >
              <span
                className={cn(
                  'grid place-items-center w-5 h-5 rounded-full border transition-colors',
                  i < step ? 'bg-lime border-lime text-ink' : i === step ? 'border-lime' : 'border-white/30',
                )}
              >
                {i < step ? (
                  <Check className="w-3 h-3" strokeWidth={3} />
                ) : i === step ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                ) : null}
              </span>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ───────────────────────── Results ───────────────────────── */

function ScoreHero({ t, result, onDownload, onReset }: { t: Strings; result: AnalysisResult; onDownload: () => void; onReset: () => void }) {
  const score = Math.max(0, Math.min(100, Math.round(result.trustScore)));
  const band = scoreBand(score);
  const shown = useCountUp(score);
  const { totalIncome, balance } = result.summary;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-forest text-white p-6 sm:p-8">
      <div className="absolute inset-0 grid-lines" />
      <div
        className="absolute -top-28 -left-28 w-96 h-96 rounded-full blur-3xl opacity-40"
        style={{ background: band.color }}
      />
      <div className="relative grid md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-center">
        <div className="flex justify-center">
          <ScoreGauge score={score} size={240} stroke={16} track="rgba(255,255,255,0.10)" tickColor="rgba(255,255,255,0.35)">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">{t.trustScore}</span>
            <span className="font-display text-[84px] leading-[0.9] tabular">{shown}</span>
            <span className="text-xs text-white/50">{t.outOf}</span>
          </ScoreGauge>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50 mb-3">{t.yourProfile}</div>
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-extrabold"
            style={{ background: band.soft, color: band.key === 'low' ? '#c6f36b' : band.color }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: band.color }} />
            {riskLabel(t, score)}
          </span>

          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4 sm:col-span-2">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/50 font-bold">
                <Wallet className="w-3.5 h-3.5" /> {t.suggestedLoan}
              </div>
              <div className="font-display text-2xl sm:text-3xl mt-1.5 leading-tight">{result.loanEligibility}</div>
            </div>
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4">
              <div className="text-[11px] uppercase tracking-wider text-white/50 font-bold">{t.savingsRate}</div>
              <div className="font-display text-3xl mt-1 tabular">{savingsRate}%</div>
            </div>
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4">
              <div className="text-[11px] uppercase tracking-wider text-white/50 font-bold">{t.transactions}</div>
              <div className="font-display text-3xl mt-1 tabular">{result.summary.transactionCount}</div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-2 rounded-full bg-lime text-ink px-4 py-2.5 text-sm font-extrabold hover:bg-white transition-colors"
            >
              <Download className="w-4 h-4" />
              {t.downloadScore}
            </button>
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {t.newAnalysis}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Wallet; tone: string }) {
  return (
    <div className="rounded-[22px] bg-white border border-line p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</span>
        <span className={cn('grid place-items-center w-7 h-7 rounded-lg', tone)}>
          <Icon className="w-3.5 h-3.5" />
        </span>
      </div>
      <div className="mt-3 text-lg sm:text-xl font-extrabold tabular tracking-tight truncate">{value}</div>
    </div>
  );
}

function Results(p: DashboardProps & { result: AnalysisResult }) {
  const { t, result, chartData, lang } = p;
  const s = result.summary;
  const bars = chartData.map((d) => ({ ...d, label: formatMonth(d.month, lang) }));
  const catTotal = result.categories.reduce((a, c) => a + c.value, 0);

  const reveal = (i: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.1 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <div className="space-y-5">
      <motion.div {...reveal(0)}>
        <ScoreHero t={t} result={result} onDownload={p.onDownload} onReset={p.onReset} />
      </motion.div>

      <motion.div {...reveal(1)} className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Kpi label={t.totalIncome} value={formatKES(s.totalIncome)} icon={TrendingUp} tone="bg-leaf/10 text-leaf" />
        <Kpi label={t.totalExpenses} value={formatKES(s.totalExpenses)} icon={TrendingDown} tone="bg-coral/10 text-coral" />
        <Kpi label={t.netBalance} value={formatKES(s.balance)} icon={Wallet} tone="bg-sand text-forest" />
        <Kpi label={t.transactions} value={String(s.transactionCount)} icon={Receipt} tone="bg-sand text-forest" />
      </motion.div>

      <motion.div {...reveal(2)} className="grid md:grid-cols-5 gap-3">
        <div className="md:col-span-3 rounded-[22px] bg-white border border-line p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-extrabold">{t.incomeVsExpenses}</h3>
            <div className="flex items-center gap-3 text-[11px] font-bold text-muted">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-leaf" />{t.income}</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-coral" />{t.expenses}</span>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars} margin={{ top: 4, right: 0, left: -12, bottom: 0 }} barGap={4}>
                <CartesianGrid vertical={false} stroke="#ece6d9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#66756d', fontSize: 11 }} dy={8} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#66756d', fontSize: 11 }}
                  tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                />
                <Tooltip
                  cursor={{ fill: '#f6f3ec' }}
                  contentStyle={tooltipStyle}
                  formatter={(v) => formatKES(Number(v))}
                />
                <Bar dataKey="income" name={t.income} fill="#1fa971" radius={[6, 6, 2, 2]} maxBarSize={34} />
                <Bar dataKey="expenses" name={t.expenses} fill="#e0573f" radius={[6, 6, 2, 2]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-2 rounded-[22px] bg-white border border-line p-5 sm:p-6">
          <h3 className="font-extrabold mb-3">{t.expenseCategories}</h3>
          {result.categories.length === 0 ? (
            <div className="h-60 grid place-items-center text-sm text-muted">{t.noSpending}</div>
          ) : (
            <>
              <div className="relative h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={result.categories}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={46}
                      outerRadius={66}
                      paddingAngle={3}
                      cornerRadius={4}
                      stroke="none"
                    >
                      {result.categories.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatKES(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{t.expenses}</span>
                  <span className="text-sm font-extrabold tabular">
                    {catTotal >= 1000 ? `${(catTotal / 1000).toFixed(1)}k` : catTotal}
                  </span>
                </div>
              </div>
              <ul className="mt-3 space-y-2">
                {result.categories.slice(0, 6).map((c, i) => (
                  <li key={c.name} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                    <span className="truncate flex-1">{c.name}</span>
                    <span className="font-mono text-xs text-muted tabular">
                      {catTotal ? Math.round((c.value / catTotal) * 100) : 0}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </motion.div>

      <motion.div {...reveal(3)} className="relative overflow-hidden rounded-[22px] bg-lime text-ink p-6 sm:p-8">
        <PiggyBank className="absolute -right-6 -bottom-8 w-44 h-44 text-ink/[0.06]" strokeWidth={1.5} />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-ink/60 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> {t.aiRecommendation}
          </div>
          <h3 className="sr-only">{t.savingsPlan}</h3>
          <p className="font-display text-2xl sm:text-[28px] leading-snug max-w-3xl">{result.savingsRecommendation}</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export function Dashboard(p: DashboardProps) {
  const { t } = p;
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-paper/80 border-b border-line/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={p.onHome}
              aria-label={t.backToHome}
              className="grid place-items-center w-9 h-9 rounded-xl border border-line text-muted hover:text-ink hover:border-ink/20 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Logo onClick={p.onHome} />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-leaf/10 text-forest px-3 py-1.5 text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-leaf" /> {t.privacyShort}
            </span>
            <LangToggle lang={p.lang} setLang={p.setLang} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-4">
          <InputPanel {...p} />
        </div>
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={p.isAnalyzing ? 'loading' : p.result ? 'result' : 'empty'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {p.isAnalyzing ? (
                <LoadingState t={t} />
              ) : p.result ? (
                <Results {...p} result={p.result} />
              ) : (
                <EmptyState t={t} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
