"use client";

import { Section, Chip, Hint } from "./ui";
import { ARTIFACT_TYPES, ARTIFACT_TYPE_LABEL, ROLE_POOL, ROLE_ALIASES, poolMatches } from "@/lib/constants";
import { detectSource } from "@/lib/stubs";

let nextId = 100;

export default function HeadedSection({ value, onChange, onClassify, onPatchArtifact }) {
  const set = (patch) => onChange({ ...value, ...patch });

  // Read a link artifact for real (server-side). "Couldn't read it" is honest,
  // not hidden — it opens a paste box rather than guessing from the URL.
  const readLink = async (id, url) => {
    onPatchArtifact(id, { readStatus: "reading", readUrl: url, reason: null });
    try {
      const res = await fetch("/api/read-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data?.ok) onPatchArtifact(id, { readStatus: "ok", posting: data.text, jobFields: data.fields || null });
      else onPatchArtifact(id, { readStatus: "unreadable", reason: data?.reason || "unknown" });
    } catch {
      onPatchArtifact(id, { readStatus: "unreadable", reason: "fetch_failed" });
    }
  };

  const updateArtifact = (id, patch) =>
    set({ artifacts: value.artifacts.map((a) => (a.id === id ? { ...a, ...patch } : a)) });

  const addArtifact = () =>
    set({
      artifacts: [
        ...value.artifacts,
        { id: ++nextId, text: "", source: "text", type: "description", touched: false },
      ],
    });

  const removeArtifact = (id) =>
    set({ artifacts: value.artifacts.filter((a) => a.id !== id) });

  // When the user finishes editing an item: set link/text immediately (cheap,
  // deterministic), then ask the AI to classify its type. onClassify applies the
  // result via a guarded functional update — it won't override a manual pick.
  const onArtifactBlur = async (id, text) => {
    if (!text.trim()) return;
    const src = detectSource(text);
    updateArtifact(id, { source: src });
    const current = value.artifacts.find((a) => a.id === id);
    // Read the link for real if it's a URL we haven't already read.
    if (src === "link" && current?.readUrl !== text) readLink(id, text);
    if (current?.touched) return; // user chose a type by hand — leave it
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data?.type) onClassify(id, data.type);
    } catch {
      // classification is best-effort; the neutral default stands
    }
  };

  // Role type-ahead: matches on prefix / initials / substring, hidden once the
  // value is already exactly the single remaining match (i.e. it's been picked).
  const roleRaw = poolMatches(ROLE_POOL, value.role, { aliases: ROLE_ALIASES });
  const roleMatches =
    roleRaw.length === 1 && roleRaw[0].toLowerCase() === (value.role || "").trim().toLowerCase()
      ? []
      : roleRaw;

  return (
    <Section
      number={2}
      title="Where you're headed"
      subtitle="Hand us the raw material — a job post, a repo, a company page, or just a sentence. We'll read it; you don't have to label it."
    >
      {/* Optional role — with type-ahead over a broad role pool */}
      <label className="mb-1.5 block text-sm font-medium text-ink">
        Target role <span className="font-normal text-ink-faint">— optional, but the fastest signal if you know it</span>
      </label>
      <div className="relative">
        <input
          value={value.role}
          onChange={(e) => set({ role: e.target.value })}
          placeholder="e.g. Computational Biologist — or type initials (SWE, PM, RN)"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
        />
        {roleMatches.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            {roleMatches.map((r) => (
              <button
                key={r}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  set({ role: r });
                  setRoleFocus(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-brand-50"
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Unified artifact list */}
      <div className="mt-6">
        <label className="mb-1.5 block text-sm font-medium text-ink">Add material</label>
        <div className="space-y-3">
          {value.artifacts.map((a, i) => (
            <div
              key={a.id}
              className="rounded-xl border border-slate-200 bg-white p-3 fade-up"
            >
              <div className="flex items-start gap-3">
                <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-ink-soft">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <textarea
                    value={a.text}
                    onChange={(e) => updateArtifact(a.id, { text: e.target.value })}
                    onBlur={(e) => onArtifactBlur(a.id, e.target.value)}
                    rows={2}
                    placeholder="Paste a link, or describe what you're aiming at…"
                    className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
                  />
                  {a.text.trim() && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 fade-up">
                      <span className="text-xs text-ink-faint">
                        {a.source === "link" ? "🔗 link" : "📝 text"} · we read this as:
                      </span>
                      {ARTIFACT_TYPES.map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => updateArtifact(a.id, { type: t.key, touched: true })}
                          className={`rounded-full border px-2.5 py-1 text-xs transition ${
                            a.type === t.key
                              ? "border-brand-400 bg-brand-50 text-brand-700"
                              : "border-slate-200 text-ink-soft hover:border-brand-300"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {a.source === "link" && a.readStatus && (
                    <div className="mt-2 text-xs fade-up">
                      {a.readStatus === "reading" && <span className="text-ink-faint">🔗 reading link…</span>}
                      {a.readStatus === "ok" && (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">
                          ✓ read
                          {a.jobFields?.role
                            ? ` — ${a.jobFields.role}${a.jobFields.company ? ` at ${a.jobFields.company}` : ""}`
                            : ""}
                        </span>
                      )}
                      {a.readStatus === "unreadable" && (
                        <div>
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-800">
                            Couldn't read this link
                            {a.reason === "login_wall" ? " (the site blocks automated reading)" : ""}
                          </span>
                          <textarea
                            defaultValue=""
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (v) onPatchArtifact(a.id, { posting: v, readStatus: "ok" });
                            }}
                            rows={2}
                            placeholder="Paste the job description text here and we'll use it."
                            className="mt-2 w-full resize-y rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {value.artifacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArtifact(a.id)}
                    className="mt-1 flex h-6 w-6 items-center justify-center rounded-full text-ink-faint hover:bg-slate-100 hover:text-ink"
                    aria-label="Delete item"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addArtifact}
          className="mt-3 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-brand-600 hover:border-brand-300 hover:bg-brand-50"
        >
          + Add another
        </button>
        <Hint>Our guess is just a guess — tap a different label any time it's wrong.</Hint>
      </div>

      {/* Real task / ticket — its own line (dual-purpose: target + first-task seed) */}
      <div className="mt-6">
        <label className="mb-1.5 block text-sm font-medium text-ink">
          Have a real first task or ticket?{" "}
          <span className="font-normal text-ink-faint">— optional; if not, we'll simulate one</span>
        </label>
        <textarea
          value={value.realTask}
          onChange={(e) => set({ realTask: e.target.value })}
          rows={2}
          placeholder="Paste an actual ticket or first assignment if you have one from the team you're joining."
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
        />
      </div>

      {/* Instruction box */}
      <div className="mt-6">
        <label className="mb-1.5 block text-sm font-medium text-ink">
          Anything to steer us?
        </label>
        <textarea
          value={value.instructions}
          onChange={(e) => set({ instructions: e.target.value })}
          rows={2}
          placeholder='In plain words: "I care most about the imaging part," "ignore the second repo," "I want to get comfortable with GWAS."'
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
        />
        <Hint>This is where "what I want to learn" lives now — say it however feels natural.</Hint>
      </div>
    </Section>
  );
}
