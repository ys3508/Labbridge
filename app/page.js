"use client";

import { useEffect, useState } from "react";
import BackgroundSection from "@/components/BackgroundSection";
import HeadedSection from "@/components/HeadedSection";
import GoalsSection from "@/components/GoalsSection";
import TimelineSection from "@/components/TimelineSection";
import ReviewScreen from "@/components/ReviewScreen";
import PlanView from "@/components/PlanView";
import { Note } from "@/components/ui";
import { inferGoals, detectDeadline } from "@/lib/stubs";

const INITIAL = {
  background: { resume: "", extractedSkills: [], field: [], sector: [], skillsHave: [] },
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

  // Mock mode is for offline UI work. Reopen the generated workspace directly
  // after refresh so local progress/draft state can be verified without API.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mock") === "1" || localStorage.getItem("lb_mock") === "1") setStage("done");
    } catch {}
  }, []);

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

  // Generic race-safe artifact patch (used for link-reading results + paste fallback).
  const patchArtifact = (id, patch) =>
    setForm((f) => ({
      ...f,
      headed: {
        ...f.headed,
        artifacts: f.headed.artifacts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
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
      <Shell wide>
        <PlanView form={form} isBeginner={isBeginner} onBack={() => setStage("review")} />
      </Shell>
    );
  }

  return (
    <Shell>
      <Hero />
      <div className="mt-8 space-y-6">
        <BackgroundSection value={form.background} onChange={setPart("background")} />
        <HeadedSection
          value={form.headed}
          onChange={setPart("headed")}
          onClassify={classifyResult}
          onPatchArtifact={patchArtifact}
        />
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
      <p className="mt-4 text-center text-xs text-ink-faint">
        Every field is optional. An empty form still produces a plan — the full path from zero.
      </p>
      {/* Demo mode: the sample plan runs entirely on canned data — zero API. */}
      <p className="mt-2 pb-10 text-center text-xs">
        <a
          href="/?mock=1"
          className="font-medium text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-500"
        >
          Or explore a sample plan →
        </a>
      </p>
    </Shell>
  );
}

function Shell({ children, wide = false }) {
  return (
    <main className={`mx-auto px-4 py-10 sm:py-14 ${wide ? "max-w-5xl" : "max-w-2xl"}`}>{children}</main>
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
