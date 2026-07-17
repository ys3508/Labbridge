"use client";

// The diagnostic (interview-mode-spec: "the tool's first act is listening").
// Two cold questions BEFORE any teaching. The seam rule — Acknowledge → Adapt →
// Explain — is honored structurally: the contract line metabolizes the challenge
// field (model-written for fused/vulnerable intake, template otherwise), Q1 is
// the question no one can be ambushed by, Q2 arrives with permission-to-miss
// (and untimed, always — the timer belongs to the exposure ramp, later).
// Answers are graded on TWO axes (substance / delivery — never blended) and the
// verdicts ride into generation: the map is built FROM what was heard.

import { useCallback, useState } from "react";
import VoiceInput, { formatDeliveryMetrics } from "@/components/VoiceInput";

// Template contract lines for clean single-signal intake. Vulnerable/fused
// intake gets the model-written line from the intake bundle instead.
function templateContract(obstacles = [], tone = "neutral") {
  const o = obstacles.join(" ").toLowerCase();
  if (/freez|blank|panic|nerv/.test(o))
    return "You said pressure is where it goes wrong — so we start where you have ground under your feet: your own story. The technical question comes second, unhurried and untimed; whatever's missing is what the plan is for.";
  if (/rambl|long|concise|structure/.test(o))
    return "You said keeping it tight is the hard part. Try the first answer inside 90 seconds — I'll show you exactly where the time went. Then one technical question, no timer, where missing pieces just become the plan.";
  if (/gap|layoff|laid off|fired|break/.test(o))
    return "You mentioned the gap. We'll build that answer properly, later, with craft — not now, not cold. For now: just your story. The gap can be one plain sentence in it, or absent. Your call.";
  if (/language|english|accent/.test(o))
    return "Answer the first pass in whichever language thinks best — we'll build the polished English version together. Two questions, no timer, and honest feedback on both.";
  if (tone === "gentle")
    return "Before I teach you anything, I want to understand where you are. Two questions first; you can answer plainly, and whatever is unfinished becomes the work we plan around.";
  return "Before I teach you anything, I want to hear you. Two questions, cold — the way the room asks them. Then we'll both know exactly where we're starting.";
}

function diagnosticFrame(tone) {
  if (tone === "gentle") {
    return "These two questions help me build the map from you, not a template. No pass/fail here — rough is allowed, and useful.";
  }
  if (tone === "playful") {
    return "Two quick answers give the map its shape: how your story lands, and where the role stretches you. No pass/fail — rough is what prep is for.";
  }
  return "These two answers give the map its shape: how your story lands, and where the role stretches you. No pass/fail — rough is what prep is for.";
}

function q1Note(tone) {
  if (tone === "gentle") return "Just walk me through it in the way that feels natural. Rough is fine.";
  return "Most good answers here land around a minute. Don't watch the clock.";
}

function AxisBar({ label, verdict }) {
  const color =
    verdict?.status === "met" ? "text-emerald-700" : verdict?.status === "thin" ? "text-amber-700" : "text-rose-700";
  const word = verdict?.status === "met" ? "strong" : verdict?.status === "thin" ? "getting there" : "not yet";
  return (
    <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100">
      <p className="flex items-baseline justify-between gap-2">
        <span className="t-label text-ink-faint">{label}</span>
        <span className={`text-xs font-semibold ${color}`}>{word}</span>
      </p>
      {verdict?.note && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{verdict.note}</p>}
    </div>
  );
}

function DiagnosticQuestion({ title, question, note, substanceKey, deliveryKey, onGraded, onSkipQuestion, tone }) {
  const [answer, setAnswer] = useState("");
  const [delivery, setDelivery] = useState({ metrics: null, takes: [] });
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState(null);
  const [error, setError] = useState("");
  const updateDelivery = useCallback((next) => setDelivery(next), []);

  const grade = async () => {
    if (!answer.trim() || busy) return;
    setBusy(true);
    setError("");
    const deliveryFacts = formatDeliveryMetrics(delivery.metrics, delivery.takes);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: answer,
          taskTitle: `Interview diagnostic: ${question}`,
          deliverable: "A spoken-style interview answer, confirmed by the user before grading.",
          purpose: "interview",
          tone: tone || "",
          context: deliveryFacts ? `DIAGNOSTIC DELIVERY METRICS (use only for the delivery criterion; judge substance from the transcript):\n${deliveryFacts}` : "",
          criteria: [substanceKey, deliveryKey],
          redFlags: [],
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Grading failed.");
      setReview(data.review);
      onGraded?.(answer, data.review, delivery);
    } catch (e) {
      setError(e?.message || "Grading failed.");
    }
    setBusy(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="t-label text-brand-600">{title}</p>
      <p className="mt-1 text-base font-medium leading-relaxed text-ink">{question}</p>
      {note && <p className="mt-1 text-xs leading-relaxed text-ink-faint">{note}</p>}
      <VoiceInput
        value={answer}
        onChange={setAnswer}
        onMetricsChange={updateDelivery}
        onSkipQuestion={onSkipQuestion}
        tone={tone}
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={grade}
          disabled={busy || !answer.trim()}
          className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {busy ? "Reviewing…" : review ? "Grade again" : "I'm done — be honest"}
        </button>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
      {review && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <AxisBar label="Substance — what you said" verdict={review.criteria?.[0]} />
          <AxisBar label="Delivery — how you said it" verdict={review.criteria?.[1]} />
          {review.overall && (
            <p className="text-xs leading-relaxed text-ink-soft sm:col-span-2">{review.overall}</p>
          )}
        </div>
      )}
    </div>
  );
}

function saveDiagnosticBaseline(key, answer, review, delivery) {
  if (typeof window === "undefined") return;
  const finalMetrics = delivery?.metrics || null;
  const safeEntry = {
    answer,
    review,
    delivery: finalMetrics ? { metrics: finalMetrics } : null,
    savedAt: Date.now(),
  };
  try {
    const prev = JSON.parse(localStorage.getItem("lb_intake_last") || "{}");
    localStorage.setItem(
      "lb_intake_last",
      JSON.stringify({
        ...prev,
        diagnostic: {
          ...(prev.diagnostic || {}),
          [key]: safeEntry,
          audioStored: false,
          retakeHistoryStored: false,
          updatedAt: Date.now(),
        },
      })
    );
  } catch {}
}

export default function DiagnosticFlow({ intake, onDone, onSkip }) {
  const [results, setResults] = useState({}); // {q1:{answer,review}, q2:{...}}
  const [hoping, setHoping] = useState("");
  const bundle = intake?.intake || {};
  const contract =
    (bundle.contractLine || "").trim() || templateContract(bundle.obstacles || [], bundle.tone);
  const q2 = bundle.q2 || "Walk me through how you would approach the core responsibility in this role.";
  const hasPostingReceipt = Boolean((bundle.q2Receipt || "").trim());

  const record = (key) => (answer, review, delivery) => {
    saveDiagnosticBaseline(key, answer, review, delivery);
    setResults((r) => ({ ...r, [key]: { answer, review, delivery }, [`${key}Skipped`]: false }));
  };

  const skipQ2 = () =>
    setResults((r) => {
      try {
        const prev = JSON.parse(localStorage.getItem("lb_intake_last") || "{}");
        localStorage.setItem(
          "lb_intake_last",
          JSON.stringify({
            ...prev,
            diagnostic: {
              ...(prev.diagnostic || {}),
              q2Skipped: true,
              audioStored: false,
              retakeHistoryStored: false,
              updatedAt: Date.now(),
            },
          })
        );
      } catch {}
      return { ...r, q2Skipped: true, q2: undefined };
    });

  const summary = () => {
    const lines = [];
    for (const [k, v] of Object.entries(results)) {
      if (!v || k.endsWith("Skipped")) continue;
      const [s, d] = v.review?.criteria || [];
      lines.push(
        `${k.toUpperCase()}: substance=${s?.status || "?"} (${s?.note || ""}) delivery=${d?.status || "?"} (${d?.note || ""})`
      );
      const deliveryFacts = formatDeliveryMetrics(v.delivery?.metrics, v.delivery?.takes, { includeHistory: false });
      if (deliveryFacts) lines.push(`${k.toUpperCase()} DELIVERY SIGNAL:\n${deliveryFacts}`);
    }
    if (results.q2Skipped) {
      lines.push("Q2: skipped by user — build the map without a substance read from the role-specific question.");
    }
    if (hoping.trim()) lines.push(`HOPING TO WORK IN (their chosen story — build answers around it): ${hoping.trim()}`);
    return lines.join("\n");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 fade-up">
      <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
        <p className="max-w-prose text-sm leading-relaxed text-ink">{contract}</p>
      </div>
      <p className="max-w-prose px-1 text-sm leading-relaxed text-ink-soft">{diagnosticFrame(bundle.tone)}</p>
      <p className="max-w-prose px-1 text-xs leading-relaxed text-ink-faint">
        We save your confirmed transcript and coaching signals for this plan. We do not store audio.
      </p>

      <DiagnosticQuestion
        title="Question 1 — the one you already know"
        question="Walk me through your background — and why this role."
        note={q1Note(bundle.tone)}
        substanceKey={bundle.q1SubstanceKey || "Connects their background to this role with specific evidence."}
        deliveryKey={bundle.q1DeliveryKey || "Result reached early; under ~90 seconds; ends pointed at this job."}
        onGraded={record("q1")}
        tone={bundle.tone}
      />

      {results.q1 && (
        // The ammunition question, asked where people are talking instead of
        // filling boxes — right after the tool showed it noticed what they
        // left out. Feeds the answer bank; no grading, no pressure.
        <label className="block rounded-xl border border-slate-200 bg-white p-4 fade-up">
          <span className="text-sm font-medium text-ink">
            Anything you were hoping to work in that didn't fit?{" "}
            <span className="text-xs font-normal text-ink-faint">one line is enough — optional</span>
          </span>
          <input
            value={hoping}
            onChange={(e) => setHoping(e.target.value)}
            placeholder="The project you're proud of, the save, the thing you'd bring up if they let you."
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 t-body text-ink focus:border-brand-300 focus:outline-none"
          />
        </label>
      )}

      <DiagnosticQuestion
        title="Question 2 — the one you might not"
        question={q2}
        note={
          (hasPostingReceipt ? `From the posting: “${bundle.q2Receipt}” — ` : "A standard question for this role — ") +
          "you might not be able to answer this yet. That's the point: whatever's missing is what the plan is for. No timer. Answer as far as you can."
        }
        substanceKey={bundle.q2SubstanceKey || "Shows the core idea and names its limits honestly."}
        deliveryKey={bundle.q2DeliveryKey || "Answer first, reasoning second; no hedging spiral."}
        onGraded={record("q2")}
        onSkipQuestion={skipQ2}
        tone={bundle.tone}
      />
      {results.q1 && !results.q2 && !results.q2Skipped && (
        <div className="-mt-3 px-1 fade-up">
          <button
            type="button"
            onClick={skipQ2}
            className="text-xs text-ink-faint underline decoration-slate-300 underline-offset-2 hover:text-ink"
          >
            Skip this one — build from what I gave you
          </button>
          <p className="mt-1 text-xs leading-relaxed text-ink-faint">
            The map loses its substance read, but it still uses your opener and stated challenge.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onSkip()}
          className="text-xs text-ink-faint underline decoration-slate-300 underline-offset-2 hover:text-ink"
        >
          Skip — build the map without hearing me first
        </button>
        <button
          type="button"
          onClick={() => onDone(summary(), results)}
          disabled={!results.q1 && !results.q2}
          className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {results.q2Skipped ? "Build my map from what I gave you →" : "Build my map from what you heard →"}
        </button>
      </div>
    </div>
  );
}
