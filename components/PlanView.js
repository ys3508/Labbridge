"use client";

import { useEffect, useState } from "react";
import { Note } from "./ui";
import { DEPTH_OPTIONS, PURPOSE_OPTIONS } from "@/lib/constants";

export default function PlanView({ form, isBeginner, onBack }) {
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [showPayload, setShowPayload] = useState(false);
  const [ground, setGround] = useState({}); // "i-j" -> verification result
  const [grounding, setGrounding] = useState(false);

  const payload = buildPayload(form, isBeginner);

  useEffect(() => {
    let alive = true;
    setError(null);
    fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.plan) setPlan(d.plan);
        else setError(d.error || "Plan generation failed.");
      })
      .catch(() => alive && setError("Couldn't reach the plan generator."));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once the plan is in, verify its resources against real catalogs.
  useEffect(() => {
    if (!plan) return;
    const flat = [];
    plan.learningSequence.forEach((s, i) =>
      (s.resources || []).forEach((r, j) => flat.push({ key: `${i}-${j}`, title: r.title, kind: r.kind }))
    );
    if (!flat.length) return;
    let alive = true;
    setGrounding(true);
    fetch("/api/ground", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resources: flat.map((f) => ({ title: f.title, kind: f.kind })) }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const map = {};
        (d.results || []).forEach((res, k) => {
          if (flat[k]) map[flat[k].key] = res;
        });
        setGround(map);
      })
      .catch(() => {})
      .finally(() => alive && setGrounding(false));
    return () => {
      alive = false;
    };
  }, [plan]);

  if (error) {
    return (
      <div className="fade-up">
        <Note tone="warn">{error}</Note>
        <button onClick={onBack} className="mt-6 text-sm font-medium text-ink-soft hover:text-ink">
          ← Back to edit
        </button>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center fade-up">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
        <p className="mt-4 text-sm font-medium text-ink">Building your onboarding plan…</p>
        <p className="mt-1 text-xs text-ink-faint">Reading your background and mapping the path. ~10–20s.</p>
      </div>
    );
  }

  const depthLabel = DEPTH_OPTIONS.find((d) => d.key === form.goals.depth)?.label;
  const purposeLabel = PURPOSE_OPTIONS.find((p) => p.key === form.goals.purpose)?.label;

  return (
    <div className="fade-up space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-500">Your onboarding plan</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          {form.headed.role ? `Toward ${form.headed.role}` : "Where you're headed"}
        </h1>
        <p className="mt-2 text-ink-soft">{plan.summary}</p>
        {(depthLabel || purposeLabel) && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {depthLabel && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-ink-soft">{depthLabel}</span>}
            {purposeLabel && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-ink-soft">{purposeLabel}</span>}
          </div>
        )}
      </header>

      {isBeginner && (
        <Note>
          We built this assuming you're <strong>starting fresh</strong> — tell us what you already know to trim it.
        </Note>
      )}

      {/* Strengths */}
      <Card title="What you already bring" accent>
        <PointList items={plan.transferableStrengths} />
      </Card>

      {/* Gaps */}
      <Card title="What's actually missing">
        <PointList items={plan.knowledgeGaps} />
      </Card>

      {/* Learning sequence */}
      <Card title="Your learning path" subtitle="In order — each step builds on the last.">
        <ol className="space-y-4">
          {plan.learningSequence.map((s, i) => (
            <li key={i} className="relative pl-8">
              <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
                {i + 1}
              </span>
              <div className="font-medium text-ink">{s.topic}</div>
              <div className="mt-0.5 text-sm text-ink-soft">{s.why}</div>
              {s.resources?.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {s.resources.map((r, j) => (
                    <Resource key={j} r={r} g={ground[`${i}-${j}`]} grounding={grounding} />
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </Card>

      {/* Resource grounding legend */}
      <Note>
        <strong>Resources are checked against public catalogs</strong> — books via Open Library, papers via OpenAlex.
        A <span className="font-medium text-emerald-700">✓ verified</span> tag links to a real record;{" "}
        <span className="font-medium text-amber-700">unverified</span> means we couldn't find it; and courses or docs
        aren't in these catalogs, so they're marked to double-check. Deeper grounding (retraction checks, more sources)
        is still in progress.
      </Note>

      {/* First task */}
      <Card title="Your first contribution" accent>
        <div className="font-medium text-ink">{plan.firstTask.title}</div>
        <p className="mt-1 text-sm text-ink-soft">{plan.firstTask.why}</p>
        {plan.firstTask.steps?.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {plan.firstTask.steps.map((step, i) => (
              <li key={i} className="flex items-baseline gap-2 text-sm text-ink">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                {step}
              </li>
            ))}
          </ul>
        )}
        {!form.headed.realTask?.trim() && (
          <p className="mt-3 text-xs text-ink-faint">
            Illustrative — a representative first task. With a real ticket from your team, this becomes your actual one.
          </p>
        )}
      </Card>

      {plan.timelineNote && (
        <p className="text-sm text-ink-soft">
          <span className="font-medium text-ink">Pace:</span> {plan.timelineNote}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-slate-200 pt-6">
        <button onClick={onBack} className="text-sm font-medium text-ink-soft hover:text-ink">
          ← Back to edit
        </button>
        <button
          type="button"
          onClick={() => setShowPayload((s) => !s)}
          className="text-xs text-ink-faint hover:text-ink-soft"
        >
          {showPayload ? "Hide" : "Show"} what the generator received
        </button>
      </div>

      {showPayload && (
        <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}
    </div>
  );
}

function Card({ title, subtitle, accent, children }) {
  return (
    <section
      className={`rounded-2xl border p-6 ${accent ? "border-brand-200 bg-brand-50/50" : "border-slate-200 bg-white"}`}
    >
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Resource({ r, g, grounding }) {
  const status = g?.status;
  const linked = status === "verified" || status === "retracted";
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-faint">
        {r.kind}
      </span>
      {linked ? (
        <a
          href={g.url}
          target="_blank"
          rel="noreferrer"
          className="text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-500"
        >
          {r.title}
        </a>
      ) : (
        <span className="text-ink">{r.title}</span>
      )}
      {!g && grounding && <span className="text-[10px] text-ink-faint">checking…</span>}
      {status === "verified" && (
        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
          ✓ verified · {g.source}
          {g.year ? ` ${g.year}` : ""}
        </span>
      )}
      {status === "retracted" && (
        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">⚠ retracted</span>
      )}
      {status === "uncheckable" && (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-ink-faint">double-check</span>
      )}
      {status === "unverified" && (
        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">unverified</span>
      )}
    </li>
  );
}

function PointList({ items }) {
  if (!items?.length) return <p className="text-sm text-ink-faint">—</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <li key={i} className="text-sm">
          <span className="font-medium text-ink">{it.point}</span>
          <span className="text-ink-soft"> — {it.detail}</span>
        </li>
      ))}
    </ul>
  );
}

function buildPayload(form, isBeginner) {
  return {
    background: {
      field: form.background.field,
      skills: [
        ...form.background.extractedSkills.map((s) => s.skill),
        ...form.background.skillsHave,
      ],
      resume: form.background.resume,
      isBeginner,
    },
    target: {
      role: form.headed.role,
      artifacts: form.headed.artifacts
        .filter((a) => (a.text || "").trim())
        .map((a) => ({ type: a.type, text: a.text })),
      realTask: form.headed.realTask,
      instructions: form.headed.instructions,
    },
    goals: { depth: form.goals.depth, purpose: form.goals.purpose },
    timeline: {
      mode: form.timeline.mode,
      deadline: form.timeline.deadline,
      weeklyHrs: form.timeline.weeklyHrs,
    },
  };
}
