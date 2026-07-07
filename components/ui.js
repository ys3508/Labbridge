"use client";

// Small shared UI primitives.

export function Section({ number, title, subtitle, children, muted }) {
  return (
    <section
      className={`rounded-2xl border bg-white/80 backdrop-blur-sm shadow-sm transition ${
        muted ? "border-slate-100 opacity-70" : "border-slate-200"
      }`}
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-baseline gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
            {number}
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
          </div>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </section>
  );
}

export function Chip({ children, onRemove, active, onClick, tone = "default" }) {
  const tones = {
    default: "border-slate-200 bg-white text-ink hover:border-brand-300",
    active: "border-brand-400 bg-brand-50 text-brand-700",
    ghost: "border-dashed border-slate-300 bg-transparent text-ink-soft hover:border-brand-300 hover:text-brand-600",
  };
  const cls = active ? tones.active : tones[tone] || tones.default;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${cls} ${
        onClick ? "cursor-pointer select-none" : ""
      }`}
      onClick={onClick}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 -mr-1 flex h-4 w-4 items-center justify-center rounded-full text-ink-faint hover:bg-slate-200 hover:text-ink"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
}

export function Hint({ children }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-faint">
      <span className="mt-px">›</span>
      <span>{children}</span>
    </p>
  );
}

export function Note({ children, tone = "info" }) {
  const tones = {
    info: "border-brand-200 bg-brand-50 text-brand-800",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>
  );
}

export function OptionCard({ label, hint, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
        selected
          ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300"
          : "border-slate-200 bg-white hover:border-brand-300"
      }`}
    >
      <div className="text-sm font-medium text-ink">{label}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-soft">{hint}</div>}
    </button>
  );
}
