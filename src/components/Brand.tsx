import { cn } from '../lib/utils';
import { Language } from '../translations';

export function Logo({ dark = false, onClick }: { dark?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex items-center gap-2.5 group', dark ? 'text-white' : 'text-ink')}
      aria-label="TrustFlow home"
    >
      <span className="relative grid place-items-center w-9 h-9 rounded-xl bg-forest text-lime shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)]">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
          <path d="M4 15c2.5 0 3-6 5.5-6S12 15 14.5 15 17 9 20 9" />
        </svg>
      </span>
      <span className="text-[19px] font-extrabold tracking-tight">
        Trust<span className={dark ? 'text-lime' : 'text-leaf'}>Flow</span>
      </span>
    </button>
  );
}

export function LangToggle({
  lang,
  setLang,
  dark = false,
}: {
  lang: Language;
  setLang: (l: Language) => void;
  dark?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        'inline-flex p-1 rounded-full text-xs font-bold border',
        dark ? 'border-white/15 bg-white/5' : 'border-line bg-white/70',
      )}
    >
      {(['en', 'sw'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            'px-3 py-1.5 rounded-full transition-colors',
            lang === l
              ? dark
                ? 'bg-lime text-ink'
                : 'bg-ink text-white'
              : dark
                ? 'text-white/60 hover:text-white'
                : 'text-muted hover:text-ink',
          )}
        >
          {l === 'en' ? 'EN' : 'SW'}
        </button>
      ))}
    </div>
  );
}
