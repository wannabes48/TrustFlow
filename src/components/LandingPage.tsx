import { motion } from 'motion/react';
import {
  ArrowRight, ArrowUpRight, ClipboardPaste, Sparkles, ShieldCheck, Lock, FileCheck2, MessageSquareText,
} from 'lucide-react';
import { Language, Strings } from '../translations';
import { Logo, LangToggle } from './Brand';
import { ScoreGauge } from './ScoreGauge';

interface LandingPageProps {
  t: Strings;
  lang: Language;
  setLang: (l: Language) => void;
  onStart: (withSample?: boolean) => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const MOCK_BARS = [
  [62, 30], [48, 34], [74, 38], [66, 29], [88, 41], [80, 36],
];

function HeroMockup({ t }: { t: Strings }) {
  return (
    <div className="relative mx-auto w-full max-w-[440px] lg:max-w-none">
      {/* SMS bubbles feeding the score */}
      <motion.div
        initial={{ opacity: 0, x: -30, rotate: -6 }}
        animate={{ opacity: 1, x: 0, rotate: -4 }}
        transition={{ delay: 0.5, duration: 0.7 }}
        className="hidden sm:block absolute -left-10 top-6 z-20 w-60 rounded-2xl rounded-bl-md bg-white p-3.5 shadow-xl shadow-forest/10 border border-line"
      >
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
          <MessageSquareText className="w-3 h-3" /> M-PESA
        </div>
        <p className="font-mono text-[11px] leading-relaxed text-ink/80">
          QZ12…312 Confirmed. You have received <b className="text-leaf">Ksh 6,000</b> from Client A…
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 30, rotate: 6 }}
        animate={{ opacity: 1, x: 0, rotate: 3 }}
        transition={{ delay: 0.75, duration: 0.7 }}
        className="hidden sm:block absolute -right-6 bottom-24 z-20 w-56 rounded-2xl rounded-br-md bg-white p-3.5 shadow-xl shadow-forest/10 border border-line"
      >
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
          <MessageSquareText className="w-3 h-3" /> M-PESA
        </div>
        <p className="font-mono text-[11px] leading-relaxed text-ink/80">
          QY55…322 Confirmed. <b className="text-coral">Ksh 2,000</b> sent to Mama Mboga Market…
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-[32px] bg-forest text-white p-6 sm:p-8 shadow-2xl shadow-forest/30 overflow-hidden"
      >
        <div className="absolute inset-0 grid-lines opacity-60" />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-lime/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">{t.trustScore}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf/20 text-lime px-2.5 py-1 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-lime" /> {t.lowRisk}
            </span>
          </div>
          <div className="flex justify-center -my-2">
            <ScoreGauge score={84} size={230} track="rgba(255,255,255,0.10)" tickColor="rgba(255,255,255,0.35)">
              <span className="font-display text-7xl leading-none">84</span>
              <span className="text-xs text-white/50 mt-1">{t.outOf}</span>
            </ScoreGauge>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3.5">
              <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold">{t.suggestedLoan}</div>
              <div className="font-display text-2xl mt-1">KES 25,000</div>
            </div>
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3.5">
              <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold">{t.incomeVsExpenses}</div>
              <div className="flex items-end gap-1 h-8 mt-1.5">
                {MOCK_BARS.map(([i, e], k) => (
                  <div key={k} className="flex-1 flex items-end gap-px h-full">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${i}%` }}
                      transition={{ delay: 0.8 + k * 0.06, duration: 0.5 }}
                      className="flex-1 rounded-sm bg-lime"
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${e}%` }}
                      transition={{ delay: 0.85 + k * 0.06, duration: 0.5 }}
                      className="flex-1 rounded-sm bg-white/30"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function LandingPage({ t, lang, setLang, onStart }: LandingPageProps) {
  const stats = [
    { value: '0', label: t.statStored, unit: 'bytes' },
    { value: '<15', label: t.statSpeed, unit: 'sec' },
    { value: '3', label: t.statFormats },
    { value: '2', label: t.statLangs },
  ];

  const steps = [
    { icon: ClipboardPaste, title: t.step1Title, desc: t.step1Desc },
    { icon: Sparkles, title: t.step2Title, desc: t.step2Desc },
    { icon: FileCheck2, title: t.step3Title, desc: t.step3Desc },
  ];

  const bands = [
    { range: '0–40', label: t.highRisk, desc: t.bandHighDesc, color: 'bg-coral', text: 'text-coral', width: '40%' },
    { range: '41–70', label: t.mediumRisk, desc: t.bandMediumDesc, color: 'bg-amber', text: 'text-amber', width: '30%' },
    { range: '71–100', label: t.lowRisk, desc: t.bandLowDesc, color: 'bg-leaf', text: 'text-leaf', width: '30%' },
  ];

  return (
    <div className="min-h-screen bg-paper">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-paper/80 border-b border-line/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <LangToggle lang={lang} setLang={setLang} />
            <button
              onClick={() => onStart()}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-ink text-white pl-4 pr-3 py-2 text-sm font-bold hover:bg-forest transition-colors"
            >
              {t.getScore} <ArrowUpRight className="w-4 h-4 text-lime" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative paper-glow overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-20 sm:pb-28 grid lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1.5 text-xs font-bold text-forest mb-7">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-leaf animate-ping opacity-60" />
                <span className="relative w-2 h-2 rounded-full bg-leaf" />
              </span>
              {t.subtitle}
            </div>
            <h1 className="font-display text-[44px] sm:text-6xl lg:text-[76px] leading-[0.95] tracking-[-0.01em] text-ink">
              {t.heroLead}{' '}
              <em className="text-leaf">{t.heroAccent}</em>
            </h1>
            <p className="mt-7 text-lg text-muted leading-relaxed max-w-xl">{t.heroDesc}</p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onStart()}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-forest text-white pl-7 pr-2 py-2 text-base font-bold hover:bg-ink transition-colors shadow-lg shadow-forest/20"
              >
                {t.getStarted}
                <span className="grid place-items-center w-10 h-10 rounded-full bg-lime text-ink transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="w-5 h-5" />
                </span>
              </button>
              <button
                onClick={() => onStart(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white/60 px-6 py-4 text-base font-bold text-ink hover:bg-white hover:border-ink/20 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-leaf" />
                {t.tryDemo}
              </button>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm text-muted">
              <Lock className="w-4 h-4 text-leaf" />
              {t.privacyBadge}
            </div>
          </motion.div>

          <HeroMockup t={t} />
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-line bg-white/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="py-8 px-2 sm:px-6 border-line odd:border-r md:border-r md:last:border-r-0 [&:nth-child(-n+2)]:border-b md:[&:nth-child(-n+2)]:border-b-0"
            >
              <div className="font-display text-5xl text-forest leading-none">
                {s.value}
                {s.unit && <span className="text-xl text-muted ml-1.5 font-sans font-semibold">{s.unit}</span>}
              </div>
              <div className="mt-2 text-sm text-muted">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="max-w-2xl mb-14">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-leaf mb-4">{t.howItWorks}</div>
            <h2 className="font-display text-4xl sm:text-5xl leading-tight">{t.ctaTitle}</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                className="group relative rounded-[28px] bg-white border border-line p-7 hover:border-forest/30 hover:shadow-xl hover:shadow-forest/5 transition-all"
              >
                <div className="flex items-start justify-between mb-10">
                  <span className="grid place-items-center w-12 h-12 rounded-2xl bg-sand text-forest group-hover:bg-forest group-hover:text-lime transition-colors">
                    <step.icon className="w-6 h-6" />
                  </span>
                  <span className="font-display text-6xl leading-none text-line group-hover:text-lime transition-colors">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold mb-2">{step.title}</h3>
                <p className="text-muted leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Score bands */}
      <section className="pb-24 sm:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="rounded-[32px] bg-white border border-line p-7 sm:p-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
              <div>
                <h2 className="font-display text-4xl sm:text-5xl leading-tight">{t.bandsTitle}</h2>
                <p className="text-muted mt-2">{t.bandsDesc}</p>
              </div>
              <div className="font-mono text-xs text-muted">0 ─────────── 100</div>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden gap-1 mb-8">
              {bands.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
                  style={{ width: b.width, transformOrigin: 'left' }}
                  className={`${b.color} rounded-full`}
                />
              ))}
            </div>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {bands.map((b, i) => (
                <div key={i} className="border-t border-line pt-5">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className={`text-sm font-extrabold ${b.text}`}>{b.label}</span>
                    <span className="font-mono text-xs text-muted">{b.range}</span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Privacy + certificate */}
      <section className="pb-24 sm:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.4fr_1fr] gap-5">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-[32px] bg-forest text-white p-8 sm:p-12"
          >
            <div className="absolute inset-0 grid-lines" />
            <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-leaf/25 blur-3xl" />
            <div className="relative">
              <span className="grid place-items-center w-14 h-14 rounded-2xl bg-lime text-ink mb-8">
                <ShieldCheck className="w-7 h-7" />
              </span>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-lime mb-4">{t.privacyTitle}</div>
              <h2 className="font-display text-4xl sm:text-5xl leading-tight max-w-lg">{t.privacyHeadline}</h2>
              <p className="mt-5 text-white/70 max-w-md leading-relaxed">{t.privacyDesc}</p>
            </div>
          </motion.div>
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="rounded-[32px] bg-lime text-ink p-8 sm:p-10 flex flex-col"
          >
            <FileCheck2 className="w-8 h-8 mb-8" />
            <h3 className="font-display text-3xl sm:text-4xl leading-tight">{t.certTitle}</h3>
            <p className="mt-4 text-ink/70 leading-relaxed">{t.certDesc}</p>
            <div className="mt-auto pt-8">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-ink/60 mb-1">{t.impactTitle}</div>
              <p className="text-sm text-ink/80">{t.impactDesc}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            {...fadeUp}
            className="rounded-[32px] border border-line bg-white px-7 py-12 sm:p-16 text-center"
          >
            <h2 className="font-display text-4xl sm:text-6xl leading-[1.05] max-w-3xl mx-auto">
              {t.heroLead} <em className="text-leaf">{t.heroAccent}</em>
            </h2>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => onStart()}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-forest text-white pl-7 pr-2 py-2 text-base font-bold hover:bg-ink transition-colors"
              >
                {t.getStarted}
                <span className="grid place-items-center w-10 h-10 rounded-full bg-lime text-ink transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="w-5 h-5" />
                </span>
              </button>
              <button
                onClick={() => onStart(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-6 py-4 text-base font-bold hover:border-ink/20 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-leaf" />
                {t.tryDemo}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <Logo />
          <div className="text-sm text-muted">© {new Date().getFullYear()} TrustFlow. {t.footerTag}</div>
          <LangToggle lang={lang} setLang={setLang} />
        </div>
      </footer>
    </div>
  );
}
