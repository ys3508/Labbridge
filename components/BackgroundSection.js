"use client";

import { useEffect, useRef, useState } from "react";
import { Section, Chip, Hint, Note } from "./ui";
import { FIELD_SUGGESTIONS, FIELD_POOL, FIELD_ALIASES, SKILL_SUGGESTIONS, poolMatches } from "@/lib/constants";

export default function BackgroundSection({ value, onChange }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [showFallback, setShowFallback] = useState(false);
  const [fieldDraft, setFieldDraft] = useState("");
  const [skillDraft, setSkillDraft] = useState("");
  const debounceRef = useRef(null);
  const lastAnalyzed = useRef("");
  const reqIdRef = useRef(0);

  const set = (patch) => onChange({ ...value, ...patch });

  // Live resume analysis — debounced ~800ms, real AI extraction via /api/analyze.
  useEffect(() => {
    const text = value.resume || "";
    if (text.trim() === lastAnalyzed.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 12) {
      setAnalyzing(false);
      setError(null);
      if (value.extractedSkills.length) set({ extractedSkills: [] });
      lastAnalyzed.current = text.trim();
      return;
    }

    setAnalyzing(true);
    setError(null);
    const myReq = ++reqIdRef.current;
    // A big jump in length is a paste (not typing) — analyze almost immediately
    // so the keywords appear on their own, no need to click out of the box.
    const delta = Math.abs(text.trim().length - lastAnalyzed.current.length);
    const delay = delta > 40 ? 200 : 800;
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (myReq !== reqIdRef.current) return; // superseded by a newer keystroke
        setAnalyzing(false);
        if (!res.ok || data.error) {
          setError(data.error || "Analysis failed.");
          return;
        }
        lastAnalyzed.current = text.trim();
        const patch = { extractedSkills: data.skills || [] };
        if (data.field && !value.field.includes(data.field)) {
          patch.field = [...value.field, data.field];
        }
        if (data.sector && !(value.sector || []).includes(data.sector)) {
          patch.sector = [...(value.sector || []), data.sector];
        }
        set(patch);
      } catch {
        if (myReq !== reqIdRef.current) return;
        setAnalyzing(false);
        setError("Couldn't reach the analyzer — fill in your background manually below.");
      }
    }, delay);

    return () => debounceRef.current && clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.resume]);

  const removeExtracted = (name) =>
    set({ extractedSkills: value.extractedSkills.filter((s) => s.skill !== name) });

  const toggleSkill = (s) => {
    const has = value.skillsHave.includes(s);
    set({ skillsHave: has ? value.skillsHave.filter((x) => x !== s) : [...value.skillsHave, s] });
  };

  const addField = (f) => {
    const v = f.trim();
    if (v && !value.field.includes(v)) set({ field: [...value.field, v] });
    setFieldDraft("");
  };
  const addSkill = (s) => {
    const v = s.trim();
    if (v && !value.skillsHave.includes(v)) set({ skillsHave: [...value.skillsHave, v] });
    setSkillDraft("");
  };

  const fieldMatches = poolMatches(FIELD_POOL, fieldDraft, {
    exclude: value.field,
    aliases: FIELD_ALIASES,
  });

  return (
    <Section
      number={1}
      title="Your background"
      subtitle="Everything here is optional. Blank just means we'll start you from scratch."
    >
      {/* Resume paste */}
      <label className="mb-1.5 block text-sm font-medium text-ink">
        Paste your resume
        {analyzing && (
          <span className="ml-2 text-xs font-normal text-brand-500">analyzing…</span>
        )}
      </label>
      <textarea
        value={value.resume}
        onChange={(e) => set({ resume: e.target.value })}
        rows={5}
        placeholder="Paste anything — a resume, a bio, a few lines about what you've done. We'll pull out skills as you type."
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
      />

      {error && (
        <div className="mt-3 fade-up">
          <Note tone="warn">{error}</Note>
        </div>
      )}

      {value.extractedSkills.length > 0 && (
        <div className="mt-3 space-y-3 fade-up">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            What we picked up — edit freely
          </p>
          {value.field.length > 0 && (
            <ChipGroup
              label="Field"
              items={value.field}
              onRemove={(f) => set({ field: value.field.filter((x) => x !== f) })}
            />
          )}
          {(value.sector || []).length > 0 && (
            <ChipGroup
              label="Sector"
              items={value.sector}
              onRemove={(s) => set({ sector: value.sector.filter((x) => x !== s) })}
            />
          )}
          <ChipGroup
            label="Skills"
            items={value.extractedSkills.map((s) => s.skill)}
            onRemove={removeExtracted}
          />
          <Hint>A wrong read is a two-second fix — remove anything that isn't you.</Hint>
        </div>
      )}

      {/* Additive manual entry (works with OR without a resume) */}
      <button
        type="button"
        onClick={() => setShowFallback((s) => !s)}
        className="mt-6 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        {showFallback ? "− Hide" : "+ Add more by hand — field, skills, anything the resume missed"}
      </button>

      {showFallback && (
        <div className="mt-4 space-y-6 fade-up">
          <p className="text-xs text-ink-soft">
            Use this whether or not you pasted a resume — add anything you want us to know that isn't captured above.
          </p>
          {/* Field of study/work */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Field of study or work
            </label>
            <div className="flex flex-wrap gap-2">
              {value.field.map((f) => (
                <Chip key={f} active tone="active" onRemove={() => set({ field: value.field.filter((x) => x !== f) })}>
                  {f}
                </Chip>
              ))}
            </div>
            <div className="relative mt-2">
              <input
                value={fieldDraft}
                onChange={(e) => setFieldDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addField(fieldDraft))}
                placeholder="Type a field — e.g. Public Health"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
              />
              {fieldMatches.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {fieldMatches.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => addField(f)}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-brand-50"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!fieldDraft && (
              <div className="mt-2 flex flex-wrap gap-2">
                {FIELD_SUGGESTIONS.slice(0, 7)
                  .filter((f) => !value.field.includes(f))
                  .map((f) => (
                    <Chip key={f} tone="ghost" onClick={() => addField(f)}>
                      + {f}
                    </Chip>
                  ))}
              </div>
            )}
          </div>

          {/* Skills you already have */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Skills you already have
            </label>
            <div className="flex flex-wrap gap-2">
              {SKILL_SUGGESTIONS.map((s) => (
                <Chip key={s} active={value.skillsHave.includes(s)} onClick={() => toggleSkill(s)}>
                  {s}
                </Chip>
              ))}
              {value.skillsHave
                .filter((s) => !SKILL_SUGGESTIONS.includes(s))
                .map((s) => (
                  <Chip key={s} active tone="active" onRemove={() => toggleSkill(s)}>
                    {s}
                  </Chip>
                ))}
            </div>
            <input
              value={skillDraft}
              onChange={(e) => setSkillDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill(skillDraft))}
              placeholder="Add your own — press Enter"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
            />
            <Hint>These stay plain on purpose — specifics like a language or method come from your resume or what you type.</Hint>
          </div>
        </div>
      )}
    </Section>
  );
}

function ChipGroup({ label, items, onRemove }) {
  return (
    <div>
      <p className="t-label text-ink-faint">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((it) => (
          <Chip key={it} tone="active" active onRemove={() => onRemove(it)}>
            {it}
          </Chip>
        ))}
      </div>
    </div>
  );
}
