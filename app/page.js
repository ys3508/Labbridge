"use client";

import { useEffect, useState } from "react";
import BackgroundSection from "@/components/BackgroundSection";
import HeadedSection from "@/components/HeadedSection";
import GoalsSection from "@/components/GoalsSection";
import TimelineSection from "@/components/TimelineSection";
import ReviewScreen from "@/components/ReviewScreen";
import { Note } from "@/components/ui";
import { inferGoals, detectDeadline } from "@/lib/stubs";

const INITIAL = {
  background: { resume: "", extractedSkills: [], field: [], skillsHave: [] },
  headed: {
    role: "",
    artifacts: [{ id: 1, text: "", source: "text", type: "description", touched: false }],
    realTask: "",
    instructions: "",
  },
  goals: { depth: "functional", purpose: null, purposeTouched: false },
  timeline: { mode: null, deadline: "", weeklyHrs: "" },
};

export default function Page() {
  const [form, setForm] = useState(INITIAL);
  const [stage, setStage] = useState("form"); // form | review | done

  const setPart = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const filledArtifacts = form.headed.artifacts.filter((a) => (a.text || "").trim());
  const artifactCount = filledArtifacts.length;
  const hasDeadlineSignal = detectDeadline(form.headed.artifacts);
  const inferredPurpose = inferGoals(filledArtifacts, hasDeadlineSignal).purpose;

  const isBeginner =
    !form.background.resume.trim() &&
    form.background.extractedSkills.length === 0 &&
    form.background.field.length === 0 &&
    form.background.skillsHave.length === 0;

  // Infer -> confirm: seed purpose from section 02, but let the user override.
  useEffect(() => {
    if (!form.goals.purposeTouched && inferredPurpose && form.goals.purpose !== inferredPurpose) {
      setForm((f) => ({ ...f, goals: { ...f.goals, purpose: inferredPurpose } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inferredPurpose]);

  const reduceDepth = () =>
    setForm((f) => ({
      ...f,
      goals: { ...f.goals, depth: f.goals.depth === "deep" ? "functional" : "landscape" },
    }));

  // Apply an async AI classification result — functional + guarded so it can't
  // clobber concurrent edits or override a type the user set by hand.
  const classifyResult = (id, type) =>
    setForm((f) => ({
      ...f,
      headed: {
        ...f.headed,
        artifacts: f.headed.artifacts.map((a) =>
          a.id === id && !a.touched ? { ...a, type } : a
        ),
      },
    }));

  const hideTimeline = form.goals.purpose === "curious";

  if (stage === "review") {
    return (
      <Shell>
        <ReviewScreen
          form={form}
          isBeginner={isBeginner}
          onBack={() => setStage("form")}
          onConfirm={() => setStage("done")}
        />
      </Shell>
    );
  }

  if (stage === "done") {
    return (
      <Shell>
        <DoneScreen form={form} isBeginner={isBeginner} onBack={() => setStage("review")} />
      </Shell>
    );
  }

  return (
    <Shell>
      <Hero />
      <div className="mt-8 space-y-5">
        <BackgroundSection value={form.background} onChange={setPart("background")} />
        <HeadedSection value={form.headed} onChange={setPart("headed")} onClassify={classifyResult} />
        <GoalsSection
          value={form.goals}
          onChange={setPart("goals")}
          inferredPurpose={inferredPurpose}
        />
        {hideTimeline ? (
          <div className="fade-up">
            <Note>
              You're just exploring — no clock, so we've hidden the deadline step. You can add a target
              later if this turns into something more.
            </Note>
          </div>
        ) : (
          <TimelineSection
            value={form.timeline}
            onChange={setPart("timeline")}
            depth={form.goals.depth}
            artifactCount={artifactCount}
            onReduceDepth={reduceDepth}
          />
        )}
      </div>

      <div className="sticky bottom-4 mt-8 flex justify-end">
        <button
          type="button"
          onClick={() => setStage("review")}
          className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600"
        >
          Review &amp; build my plan →
        </button>
      </div>
      <p className="mt-4 pb-10 text-center text-xs text-ink-faint">
        Every field is optional. An empty form still produces a plan — the full path from zero.
      </p>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">{children}</main>
  );
}

function Hero() {
  return (
    <header>
      <div className="flex items-center gap-2 text-brand-600">
        <span className="text-lg font-bold tracking-tight">LabBridge</span>
      </div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Build your onboarding plan
      </h1>
      <p className="mt-3 text-ink-soft">
        Tell us where you're starting and where you're headed. We interpret; you correct. Whatever your
        background — engineer, analyst, clinician, designer — this is for you.
      </p>
    </header>
  );
}

function DoneScreen({ form, isBeginner, onBack }) {
  const captured = {
    background: {
      resume: form.background.resume ? `${form.background.resume.slice(0, 40)}…` : "(blank)",
      extractedSkills: form.background.extractedSkills.map((s) => s.skill),
      field: form.background.field,
      skillsHave: form.background.skillsHave,
      isBeginner,
    },
    target: {
      role: form.headed.role || null,
      artifacts: form.headed.artifacts
        .filter((a) => (a.text || "").trim())
        .map((a) => ({ source: a.source, type: a.type, raw: a.text.slice(0, 50) })),
      realTask: form.headed.realTask || null,
      instructions: form.headed.instructions || null,
    },
    goals: { depth: form.goals.depth, purpose: form.goals.purpose },
    timeline: {
      mode: form.timeline.mode,
      deadline: form.timeline.deadline || null,
      weeklyHrs: form.timeline.weeklyHrs || null,
    },
  };

  return (
    <div className="fade-up">
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6">
        <h1 className="text-xl font-semibold text-brand-800">Captured. ✓</h1>
        <p className="mt-2 text-sm text-brand-700">
          In v1 the input stops here — this is exactly the payload the matching engine will receive to
          generate the plan. Wiring that engine is the next build.
        </p>
      </div>

      <h2 className="mt-6 text-sm font-semibold text-ink">What the engine will receive</h2>
      <pre className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
        {JSON.stringify(captured, null, 2)}
      </pre>

      <button
        type="button"
        onClick={onBack}
        className="mt-6 text-sm font-medium text-ink-soft hover:text-ink"
      >
        ← Back
      </button>
    </div>
  );
}
