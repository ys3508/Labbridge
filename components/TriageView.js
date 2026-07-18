"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildTriagePriorities,
  diagnosticFingerprint,
  runwayBucket,
  runwayPlan,
  serializePriority,
  statusWord,
  triageInstructions,
  triageRestoreDecision,
  triageStorageKey,
} from "@/lib/triage";

function statusClass(status) {
  if (status === "met") return "text-emerald-700";
  if (status === "thin") return "text-amber-700";
  return "text-rose-700";
}

function move(list, from, to) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, { ...item, source: "user-override" });
  return next.map((row, index) => ({
    ...row,
    rank: index + 1,
    source: index === to || row.source === "user-override" ? row.source : "computed",
  }));
}

function toneLine(tone, bucket) {
  if (tone === "gentle" && bucket === "tomorrow") {
    return "We do not have long, so we will stay focused: one thing at a time, and kind about it.";
  }
  if (tone === "gentle") return "The order can be direct without getting harsh. We will keep the work warm and specific.";
  if (tone === "playful") return "We will keep the energy up, but the order stays honest.";
  return "Runway changes how much we do, not how human the coaching gets.";
}

export default function TriageView({ diagnosticSummary, diagnosticResults, intake, meta, onCommit, onBack }) {
  const storageKey = useMemo(() => triageStorageKey(meta), [meta]);
  const bucket = runwayBucket(meta?.date);
  const runway = runwayPlan(bucket);
  const computed = useMemo(
    () => buildTriagePriorities({ diagnosticResults, intake, meta }),
    [diagnosticResults, intake, meta]
  );
  const fingerprint = useMemo(() => diagnosticFingerprint(diagnosticResults), [diagnosticResults]);
  const [priority, setPriority] = useState(computed);
  const [overrode, setOverrode] = useState(false);
  // A prior user correction whose diagnostic read has since changed. Held so it can
  // be re-offered (not silently restored over a different weakness profile, and not
  // silently discarded either). Null when there's nothing to re-offer.
  const [staleCorrection, setStaleCorrection] = useState(null);

  useEffect(() => {
    // A saved order restores ONLY when it is a user correction AND the diagnostic
    // read that produced it is unchanged (fingerprint match). A correction from a
    // DIFFERENT read is re-offered, never silently restored — the staleness axis,
    // not override-ness, is what makes a saved order wrong (Sissi, 2026-07-18).
    let saved = null;
    let decision = "recompute";
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      decision = triageRestoreDecision(saved, fingerprint);
    } catch {}
    if (decision === "restore") {
      setPriority(saved.priority);
      setOverrode(true);
      setStaleCorrection(null);
      return;
    }
    // "reoffer" | "recompute": the fresh read wins the render; on reoffer we keep the
    // prior correction in memory so one tap can re-apply its ORDER to the fresh rows.
    setPriority(computed);
    setOverrode(false);
    setStaleCorrection(decision === "reoffer" ? saved.priority : null);
  }, [computed, storageKey, fingerprint]);

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          priority: serializePriority(priority).map((p) => {
            const full = priority.find((row) => row.dimension === p.dimension) || {};
            return { ...full, ...p };
          }),
          userOverride: overrode,
          fingerprint,
          updatedAt: Date.now(),
        })
      );
    } catch {}
  }, [fingerprint, overrode, priority, storageKey]);

  // Re-apply a re-offered correction: the user's chosen ORDER, mapped onto the
  // FRESH read's rows (current evidence/status), not the stale rows wholesale.
  const applyStaleOrder = () => {
    if (!staleCorrection) return;
    const order = staleCorrection.map((r) => r.dimension);
    const reordered = [...computed]
      .sort((a, b) => order.indexOf(a.dimension) - order.indexOf(b.dimension))
      .map((row, index) => ({ ...row, rank: index + 1, source: "user-override" }));
    setPriority(reordered);
    setOverrode(true);
    setStaleCorrection(null);
  };

  const top = priority[0];
  const overrideNote = overrode ? `Got it — you know yourself. Starting with ${top?.label || top?.dimension}.` : "";
  const commit = () => {
    const instructions = triageInstructions(priority, { runway, overrideNote });
    onCommit?.({ priority, instructions, overrideNote });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 fade-up">
      <button type="button" onClick={onBack} className="text-sm font-medium text-ink-soft hover:text-ink">
        Back to questions
      </button>

      <section className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-4">
        <p className="t-label text-brand-700">Triage</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          Your biggest lever looks like {top?.label?.toLowerCase() || "the first priority"}.
        </h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">
          From two answers, so this is a first read. I am making a call, showing the basis, and leaving the door open for you to correct it.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="t-label text-ink-faint">The read</p>
            <p className="mt-1 text-sm text-ink-soft">Three dimensions, not one blended score.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink-soft">{runway.label}</span>
        </div>
        <div className="mt-4 space-y-2">
          {priority.map((row) => (
            <div key={row.dimension} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{row.label}</p>
                <p className={`text-xs font-semibold ${statusClass(row.status)}`}>{statusWord(row.status)}</p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{row.evidence}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="t-label text-ink-faint">The call</p>
        <p className="mt-1 text-base font-semibold text-ink">
          Start with {top?.label?.toLowerCase() || "priority one"}.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Basis: {top?.rationale || "The diagnostic gave the first read, and this is the highest-leverage starting point."}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          Honest expectation: {top?.expectation || "Some pieces move quickly; some become manageable rather than erased."}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="t-label text-ink-faint">Correction door</p>
            <p className="mt-1 text-sm text-ink-soft">Not where you feel weakest? Move it.</p>
          </div>
          {overrode && <p className="text-xs font-medium text-brand-700">{overrideNote}</p>}
        </div>
        {staleCorrection && (
          <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-2 text-xs leading-relaxed text-ink-soft">
            <p>You reordered these last time — but your answers changed since, so this is a fresh read. Same call?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyStaleOrder}
                className="rounded-md bg-brand-500 px-3 py-1.5 font-semibold text-white hover:bg-brand-600"
              >
                Use my previous order
              </button>
              <button
                type="button"
                onClick={() => setStaleCorrection(null)}
                className="rounded-md border border-slate-200 px-3 py-1.5 font-semibold text-ink-soft hover:bg-slate-50"
              >
                No — use this fresh read
              </button>
            </div>
          </div>
        )}
        <div className="mt-4 space-y-2">
          {priority.map((row, index) => (
            <div key={row.dimension} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="w-6 shrink-0 text-sm font-semibold tabular-nums text-ink-faint">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{row.label}</p>
                <p className="truncate text-xs text-ink-faint">{row.rationale}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setPriority((p) => move(p, index, index - 1));
                    setOverrode(true);
                    setStaleCorrection(null);
                  }}
                  disabled={index === 0}
                  className="h-8 w-8 rounded-md border border-slate-200 text-sm text-ink-soft hover:bg-slate-50 disabled:opacity-30"
                  aria-label={`Move ${row.label} earlier`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPriority((p) => move(p, index, index + 1));
                    setOverrode(true);
                    setStaleCorrection(null);
                  }}
                  disabled={index === priority.length - 1}
                  className="h-8 w-8 rounded-md border border-slate-200 text-sm text-ink-soft hover:bg-slate-50 disabled:opacity-30"
                  aria-label={`Move ${row.label} later`}
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="t-label text-ink-faint">Runway</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{runway.copy}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{toneLine(intake?.tone, bucket)}</p>
      </section>

      {diagnosticSummary && (
        <details className="rounded-xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-ink">Diagnostic basis</summary>
          <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-ink-soft">
            {diagnosticSummary}
          </pre>
        </details>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={commit}
          className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Here's my order — build the map →
        </button>
      </div>
    </div>
  );
}
