"use client";

import { Note } from "./ui";
import { DEPTH_OPTIONS, PURPOSE_OPTIONS } from "@/lib/constants";
import { readMaterials } from "@/lib/stubs";

export default function ReviewScreen({ form, isBeginner, onBack, onConfirm }) {
  const summary = readMaterials(form.headed.artifacts, form.headed.role, form.headed.instructions);
  const depthLabel = DEPTH_OPTIONS.find((d) => d.key === form.goals.depth)?.label;
  const purposeLabel = PURPOSE_OPTIONS.find((p) => p.key === form.goals.purpose)?.label;

  return (
    <div className="fade-up">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-500">One quick check</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
        Here's how we read your materials
      </h1>
      <p className="mt-2 text-ink-soft">
        One glance. If it's right, keep going. If it's wrong, a tap or a sentence fixes it.
      </p>

      <div className="mt-6 space-y-4">
        {/* Weighting summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-ink">What we're aiming at</h2>
          {summary.empty ? (
            <div className="mt-3">
              <Note tone="warn">
                You haven't told us where you're headed yet — that's the one thing we need a thread of.
                Add even a single link, a role, or one sentence in section 2 and we'll have a target.
              </Note>
            </div>
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {summary.lines.map((l, i) => (
                  <li key={i} className="flex items-baseline gap-2 text-sm">
                    <span className="inline-block h-1.5 w-1.5 shrink-0 translate-y-1 rounded-full bg-brand-400" />
                    <span className="text-ink">
                      We're treating <strong>{l.label}</strong> as {l.role}.
                    </span>
                  </li>
                ))}
              </ul>
              {summary.focus && (
                <p className="mt-3 text-sm text-ink-soft">
                  Focused mostly on <strong className="text-ink">{summary.focus}</strong>.
                </p>
              )}
              {summary.instructions && (
                <p className="mt-2 text-sm text-ink-soft">
                  Steering note we'll honor: <em>"{summary.instructions}"</em>
                </p>
              )}
            </>
          )}
        </div>

        {/* Goals + timeline confirmation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-ink">Depth, purpose & pace</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
            <ReadItem label="Where you'll land" value={depthLabel} />
            <ReadItem label="What's driving it" value={purposeLabel} />
            <ReadItem label="Timeline" value={timelineLabel(form.timeline)} />
          </div>
        </div>

        {/* Beginner assumption, surfaced not silent */}
        {isBeginner && (
          <Note>
            We're assuming you're <strong>starting fresh</strong> — you left your background blank. Tell
            us what you already know and we'll trim the plan.
          </Note>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-ink-soft hover:text-ink"
        >
          ← Back to edit
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
        >
          Looks right — build my plan
        </button>
      </div>
    </div>
  );
}

function ReadItem({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <div className="text-xs uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="mt-0.5 font-medium text-ink">{value || "—"}</div>
    </div>
  );
}

function timelineLabel(t) {
  if (t.mode === "deadline") return t.deadline ? `By ${t.deadline}` : "Has a deadline";
  if (t.mode === "pace") return t.weeklyHrs ? `~${t.weeklyHrs} hrs/week` : "Self-paced";
  if (t.mode === "open") return "No clock";
  return "—";
}
