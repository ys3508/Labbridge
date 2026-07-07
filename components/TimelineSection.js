"use client";

import { Section, OptionCard, Note, Hint } from "./ui";
import { estimateEffortHours } from "@/lib/stubs";

const MODES = [
  { key: "deadline", label: "I have a deadline", hint: "A hard date — interview, start day." },
  { key: "pace", label: "I know my weekly pace", hint: "No date, but a rough bandwidth." },
  { key: "open", label: "I'm not on a clock", hint: "Go at my own speed." },
];

function weeksUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const ms = target - now;
  return ms > 0 ? ms / (1000 * 60 * 60 * 24 * 7) : 0;
}

function addWeeks(weeks) {
  const d = new Date();
  d.setDate(d.getDate() + Math.round(weeks * 7));
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function TimelineSection({ value, onChange, depth, artifactCount, onReduceDepth }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const effort = estimateEffortHours(depth, artifactCount);

  // Purpose curious/exploring hides this section entirely (handled by parent),
  // but we still render a calm placeholder if it's shown with no mode chosen.

  const weeks = weeksUntil(value.deadline);
  const requiredPace = weeks && weeks > 0 ? Math.ceil(effort / weeks) : null;
  const brutal = requiredPace && requiredPace > 15;

  const pace = Number(value.weeklyHrs) || 0;
  const projectedWeeks = pace > 0 ? effort / pace : null;

  return (
    <Section
      number={4}
      title="Timeline"
      subtitle="Tell us the one thing you're holding — a date, a weekly pace, or neither. We'll work out the rest."
    >
      <div className="grid gap-2 sm:grid-cols-3">
        {MODES.map((m) => (
          <OptionCard
            key={m.key}
            label={m.label}
            hint={m.hint}
            selected={value.mode === m.key}
            onClick={() => set({ mode: m.key })}
          />
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-ink-soft">
        Estimated effort for this plan: <strong className="text-ink">~{effort} hours</strong>{" "}
        <span className="text-ink-faint">(a stand-in until the real plan is generated)</span>
      </div>

      {value.mode === "deadline" && (
        <div className="mt-4 fade-up">
          <label className="mb-1.5 block text-sm font-medium text-ink">Target date</label>
          <input
            type="date"
            value={value.deadline}
            onChange={(e) => set({ deadline: e.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
          />
          {requiredPace !== null && (
            <div className="mt-3">
              {brutal ? (
                <Note tone="warn">
                  <p>
                    That works out to about <strong>{requiredPace} hrs/week</strong> — brutal. Better to
                    adjust now than fall behind. You could:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => set({ deadline: "" })}
                      className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
                    >
                      Push the date
                    </button>
                    <button
                      type="button"
                      onClick={() => set({ mode: "pace" })}
                      className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
                    >
                      Lower the weekly hours
                    </button>
                    {depth !== "landscape" && (
                      <button
                        type="button"
                        onClick={onReduceDepth}
                        className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
                      >
                        Aim for {depth === "deep" ? "functional" : "landscape"} instead
                      </button>
                    )}
                  </div>
                </Note>
              ) : (
                <Note>
                  Comfortable — about <strong>{requiredPace} hrs/week</strong> gets you there.
                </Note>
              )}
            </div>
          )}
        </div>
      )}

      {value.mode === "pace" && (
        <div className="mt-4 fade-up">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Roughly how many hours a week?
          </label>
          <input
            type="number"
            min={1}
            value={value.weeklyHrs}
            onChange={(e) => set({ weeklyHrs: e.target.value })}
            placeholder="e.g. 5"
            className="w-32 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
          />
          {projectedWeeks && (
            <div className="mt-3">
              <Note>
                At that pace you'd finish around <strong>{addWeeks(projectedWeeks)}</strong> —
                about {Math.ceil(projectedWeeks)} weeks.
              </Note>
            </div>
          )}
        </div>
      )}

      {value.mode === "open" && (
        <div className="mt-4 fade-up">
          <Hint>
            No clock — the tracker stays off until you decide you want a target. That's a real,
            equal choice, not a lesser one.
          </Hint>
        </div>
      )}
    </Section>
  );
}
