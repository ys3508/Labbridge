"use client";

import { useEffect, useRef, useState } from "react";
import { Note } from "./ui";
import { DEPTH_OPTIONS, PURPOSE_OPTIONS, WEB_AUGMENT } from "@/lib/constants";
import { looksLikeUrl } from "@/lib/stubs";

const post = (url, body) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    .then((r) => r.json())
    .catch(() => null);

export default function PlanView({ form, isBeginner, onBack }) {
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [showPayload, setShowPayload] = useState(false);
  const [topicResources, setTopicResources] = useState({}); // topicIndex -> [{title,url,source,kind,why}]
  const [resourcesDone, setResourcesDone] = useState(false);
  const [augmenting, setAugmenting] = useState(false);
  const [check, setCheck] = useState(null);
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(() => new Set()); // completed module indices
  const [activeIndex, setActiveIndex] = useState(0);
  const [drafts, setDrafts] = useState({});
  const [draftMeta, setDraftMeta] = useState({});
  // Roadmap trims: "I already know this" markers. Persisted; the leaner plan
  // regenerates only when the live model is funded — until then trims are saved
  // and the workspace keeps every task (we never silently drop content).
  const [trims, setTrims] = useState([]);
  useEffect(() => {
    if (!plan?.learningSequence) return;
    try {
      const raw = localStorage.getItem(scopedPlanKey("lb_trims", plan.learningSequence));
      if (raw) setTrims(JSON.parse(raw));
    } catch {}
  }, [plan]);
  const toggleTrim = (i) =>
    setTrims((prev) => {
      const next = prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i];
      try {
        localStorage.setItem(scopedPlanKey("lb_trims", plan.learningSequence), JSON.stringify(next));
      } catch {}
      return next;
    });
  const [momentsByTask, setMomentsByTask] = useState({});
  const [checksByTask, setChecksByTask] = useState({});
  const [futureOverrides, setFutureOverrides] = useState(() => new Set());
  const [pendingFuture, setPendingFuture] = useState(null);
  const [briefingOpen, setBriefingOpen] = useState(true);
  const [whyOpen, setWhyOpen] = useState(false);
  const [activeSurface, setActiveSurface] = useState("task");
  const [workspaceWarningDismissed, setWorkspaceWarningDismissed] = useState(false);
  const [welcomeBack, setWelcomeBack] = useState(null);
  const [stateLoaded, setStateLoaded] = useState(false);
  const taskPanelRef = useRef(null);

  // Progress persists locally so checkpoints survive a refresh (the continuity
  // a one-shot chatbot can't give). Cross-session/account memory is a later step.
  useEffect(() => {
    if (!plan) return;
    try {
      setStateLoaded(false);
      const seq = plan.learningSequence || [];
      const rawDone = localStorage.getItem(planKey(seq));
      const loadedDone = new Set(rawDone ? JSON.parse(rawDone) : []);
      const rawMoments = localStorage.getItem(scopedPlanKey("lb_moments", seq));
      const rawChecks = localStorage.getItem(scopedPlanKey("lb_checks", seq));
      const rawDrafts = localStorage.getItem(scopedPlanKey("lb_drafts", seq));
      const rawDraftMeta = localStorage.getItem(scopedPlanKey("lb_draftmeta", seq));
      const rawBriefed = localStorage.getItem(scopedPlanKey("lb_briefed", seq));
      const loadedMoments = rawMoments ? JSON.parse(rawMoments) : {};
      const loadedChecks = rawChecks ? JSON.parse(rawChecks) : {};
      const loadedDrafts = rawDrafts ? JSON.parse(rawDrafts) : {};
      const loadedDraftMeta = rawDraftMeta ? JSON.parse(rawDraftMeta) : {};
      setDone(loadedDone);
      setMomentsByTask(loadedMoments);
      setChecksByTask(loadedChecks);
      setDrafts(loadedDrafts);
      setDraftMeta(loadedDraftMeta);
      setFutureOverrides(new Set());
      setPendingFuture(null);
      setBriefingOpen(rawBriefed !== "1");
      setWhyOpen(false);
      setActiveSurface("task");
      setWorkspaceWarningDismissed(false);
      setWelcomeBack(rawBriefed === "1" ? getWelcomeBack(seq, loadedDone, loadedDrafts, loadedMoments) : null);
      const firstOpen = seq.findIndex((_, i) => !loadedDone.has(i));
      setActiveIndex(firstOpen === -1 ? Math.max(0, seq.length - 1) : firstOpen);
      setStateLoaded(true);
    } catch {}
  }, [plan]);

  useEffect(() => {
    if (!plan?.learningSequence?.length) return;
    setActiveIndex((i) => Math.min(i, plan.learningSequence.length - 1));
  }, [plan]);

  useEffect(() => {
    if (!stateLoaded || !plan?.learningSequence?.length) return;
    try {
      localStorage.setItem(scopedPlanKey("lb_moments", plan.learningSequence), JSON.stringify(momentsByTask));
    } catch {}
  }, [momentsByTask, plan, stateLoaded]);

  useEffect(() => {
    if (!stateLoaded || !plan?.learningSequence?.length) return;
    try {
      localStorage.setItem(scopedPlanKey("lb_checks", plan.learningSequence), JSON.stringify(checksByTask));
    } catch {}
  }, [checksByTask, plan, stateLoaded]);

  useEffect(() => {
    if (!stateLoaded || !plan?.learningSequence?.length) return;
    try {
      localStorage.setItem(scopedPlanKey("lb_drafts", plan.learningSequence), JSON.stringify(drafts));
    } catch {}
  }, [drafts, plan, stateLoaded]);

  useEffect(() => {
    if (!stateLoaded || !plan?.learningSequence?.length) return;
    try {
      localStorage.setItem(scopedPlanKey("lb_draftmeta", plan.learningSequence), JSON.stringify(draftMeta));
    } catch {}
  }, [draftMeta, plan, stateLoaded]);

  const markDone = (i) => {
    setDone((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      try {
        localStorage.setItem(planKey(plan.learningSequence), JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const setTaskMoment = (taskIndex, momentIndex) => {
    setMomentsByTask((prev) => ({ ...prev, [taskIndex]: momentIndex }));
  };

  const setTaskDraft = (taskIndex, draft) => {
    setDrafts((prev) => ({ ...prev, [taskIndex]: draft }));
    setDraftMeta((prev) => ({ ...prev, [taskIndex]: Date.now() }));
  };

  const toggleTaskCheck = (taskIndex, key) => {
    setChecksByTask((prev) => {
      const current = new Set(prev[taskIndex] || []);
      current.has(key) ? current.delete(key) : current.add(key);
      return { ...prev, [taskIndex]: [...current] };
    });
  };

  const payload = buildPayload(form, isBeginner);

  // If a previous render introduced horizontal overflow, Chromium can preserve
  // that stale x-position across hot reloads/back-forward restores. Keep the
  // workspace anchored at the left edge while the layout itself prevents overflow.
  useEffect(() => {
    const root = document.scrollingElement || document.documentElement;
    root.scrollLeft = 0;
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  }, []);

  // 1) Generate the plan. `attempt` lets the error state offer an honest Retry
  //    (a paid call each time — user-initiated only, never automatic).
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setError(null);
    post("/api/plan", payload).then((d) => {
      if (!alive) return;
      if (d?.plan) setPlan(d.plan);
      else setError(d?.error || "Plan generation failed.");
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  // 2) Retrieval-first resources: retrieve a verified candidate pool per topic,
  //    then let the model SELECT from it. The model never authors a shown
  //    resource — only real, verified items are chosen and explained.
  useEffect(() => {
    if (!plan) return;
    let alive = true;
    (async () => {
      const topics = plan.learningSequence.map((s, i) => ({ index: i, topic: s.topic, why: s.why, task: s.task }));
      if (!topics.length) {
        if (alive) setResourcesDone(true);
        return;
      }
      // Part B — retrieve + verify candidate pools
      const cand = await post("/api/candidates", { topics: topics.map((t) => ({ index: t.index, topic: t.topic })) });
      const pools = {};
      (cand?.candidates || []).forEach((c) => (pools[c.index] = c.pool || []));
      if (!alive) return;
      // Part C — select from the verified pools (grounded "why")
      const sel = await post("/api/select", {
        topics: topics.map((t) => ({ index: t.index, topic: t.topic, why: t.why, task: t.task, pool: pools[t.index] || [] })),
        learner: {
          field: payload.background.field,
          skills: payload.background.skills,
          depth: payload.goals.depth,
          purpose: payload.goals.purpose,
        },
      });
      const byIndex = {};
      (sel?.selections || []).forEach((s) => (byIndex[s.index] = s.resources || []));
      if (alive) {
        setTopicResources(byIndex);
        setResourcesDone(true);
      }

      // Phase 2 — fill THIN steps (fewer than 2 catalog resources) with a
      // web-verified official doc/course. Gated + non-blocking: web search is
      // slow and costly, so it only fires for steps the catalog under-served,
      // and only after the books already render.
      if (!alive) return;
      const thin = topics.filter((t) => (byIndex[t.index] || []).length < 2).slice(0, 4);
      if (WEB_AUGMENT && thin.length) {
        setAugmenting(true);
        const aug = await post("/api/augment-web", { topics: thin.map((t) => ({ index: t.index, topic: t.topic })) });
        if (alive && aug?.augments?.length) {
          setTopicResources((prev) => {
            const next = { ...prev };
            aug.augments.forEach((a) => {
              if (a.resource) next[a.index] = [...(next[a.index] || []), a.resource].slice(0, 4);
            });
            return next;
          });
        }
        if (alive) setAugmenting(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  // 3) Plan checkers (over-teaching + first-task viability).
  useEffect(() => {
    if (!plan) return;
    let alive = true;
    setChecking(true);
    post("/api/check", { plan, background: payload.background, timeline: payload.timeline })
      .then((d) => {
        if (alive && d && !d.error) setCheck(d);
      })
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  if (error) {
    return (
      <div className="fade-up">
        <Note tone="warn">{error}</Note>
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setAttempt((a) => a + 1)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Retry
          </button>
          <button onClick={onBack} className="text-sm font-medium text-ink-soft hover:text-ink">
            ← Back to edit
          </button>
        </div>
        <p className="mt-4 text-xs text-ink-faint">
          Or see the product without generating:{" "}
          <a href="/?mock=1" className="font-medium text-brand-700 underline decoration-brand-200 underline-offset-2">
            explore a sample plan →
          </a>
        </p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center fade-up">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
        <p className="mt-4 text-sm font-medium text-ink">Building your onboarding workspace…</p>
        <p className="mt-1 text-xs text-ink-faint">
          Turning your target into project tasks, deliverables, and just-enough learning. ~1–2 min.
        </p>
      </div>
    );
  }

  const depthLabel = DEPTH_OPTIONS.find((d) => d.key === form.goals.depth)?.label;
  const purposeLabel = PURPOSE_OPTIONS.find((p) => p.key === form.goals.purpose)?.label;
  const jf = payload.target.jobFields;
  const roleRaw = (form.headed.role || "").trim();
  const roleBox = roleRaw && !looksLikeUrl(roleRaw) ? roleRaw : null;
  // The header must match what the plan is actually built toward. TARGET GROUNDING
  // prioritizes a read job posting, so a real extracted posting-role wins over a
  // free-text box that may disagree with it; the box is the fallback.
  const roleName = jf?.role || roleBox || null;
  const company = jf?.company || null;
  // "from" side of the subline: their own background, verbatim (never re-categorized).
  const fromLabel =
    (payload.background.field || []).join(", ") ||
    (payload.background.sector || []).join(", ") ||
    "";
  const modules = plan.learningSequence || [];
  const activeModule = modules[activeIndex] || modules[0];
  const firstIncompleteIndexRaw = modules.findIndex((_, i) => !done.has(i));
  const firstIncompleteIndex = firstIncompleteIndexRaw === -1 ? modules.length : firstIncompleteIndexRaw;
  const allTasksDone = modules.length > 0 && done.size >= modules.length;
  const missionLine = plan.northStar?.trim() || plan.firstTask?.title || "Build the evidence package this role expects.";
  const planTitle = roleName ? `Toward ${roleName}${company ? ` at ${company}` : ""}` : "Your onboarding workspace";
  const deadline = payload.timeline.mode === "deadline" ? (payload.timeline.deadline || "").trim() : "";
  const checkFailures = checkFailureCount(check);
  const enterWorkspace = () => {
    try {
      localStorage.setItem(scopedPlanKey("lb_briefed", modules), "1");
    } catch {}
    setBriefingOpen(false);
  };
  const reopenBriefing = () => {
    setWhyOpen(false);
    setBriefingOpen(true);
  };
  const scrollTaskIntoView = () => {
    setTimeout(() => taskPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  const openTask = (i) => {
    const isFuture = firstIncompleteIndex < modules.length && i > firstIncompleteIndex && !futureOverrides.has(i);
    if (isFuture) {
      setPendingFuture(i);
      return;
    }
    setWelcomeBack(null);
    setPendingFuture(null);
    setActiveSurface("task");
    setActiveIndex(i);
    scrollTaskIntoView();
  };
  const openFutureAnyway = (i) => {
    setWelcomeBack(null);
    setFutureOverrides((prev) => new Set([...prev, i]));
    setPendingFuture(null);
    setActiveSurface("task");
    setActiveIndex(i);
    scrollTaskIntoView();
  };
  const goToRecommendedTask = () => {
    if (firstIncompleteIndex < modules.length) {
      setWelcomeBack(null);
      setPendingFuture(null);
      setActiveSurface("task");
      setActiveIndex(firstIncompleteIndex);
      scrollTaskIntoView();
    }
  };
  const completeAndAdvance = (i) => {
    setWelcomeBack(null);
    markDone(i);
    if (i < modules.length - 1) {
      setActiveIndex(i + 1);
      setTaskMoment(i + 1, 0);
      setActiveSurface("task");
      scrollTaskIntoView();
    } else {
      setActiveSurface("capstone");
      scrollTaskIntoView();
    }
  };
  const openCapstone = () => {
    if (!allTasksDone && !futureOverrides.has("capstone")) {
      setPendingFuture("capstone");
      return;
    }
    setWelcomeBack(null);
    setPendingFuture(null);
    setActiveSurface("capstone");
    scrollTaskIntoView();
  };
  const openCapstoneAnyway = () => {
    setWelcomeBack(null);
    setFutureOverrides((prev) => new Set([...prev, "capstone"]));
    setPendingFuture(null);
    setActiveSurface("capstone");
    scrollTaskIntoView();
  };

  if (briefingOpen) {
    return (
      <div className="mx-auto flex min-h-[72vh] w-full max-w-2xl flex-col justify-center fade-up">
        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-brand-500">Your onboarding briefing</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            {roleName ? `Toward ${roleName}${company ? ` at ${company}` : ""}` : "Where you're headed"}
          </h1>
          {roleName && fromLabel && (
            <p className="mt-1 text-sm text-ink-faint">
              {fromLabel} → {roleName}
            </p>
          )}
          {(plan.northStar?.trim() || plan.firstTask?.title) && (
            <div className="mt-4 rounded-lg bg-brand-50 px-3 py-2">
              <p className="t-label text-brand-600">Your mission</p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-ink">
                {shorten(plan.northStar?.trim() || plan.firstTask.title, 180)}
              </p>
            </div>
          )}
          {plan.hook && <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-soft">{plan.hook}</p>}
          <Roadmap plan={plan} modules={modules} done={done} trims={trims} onToggleTrim={toggleTrim} roleName={roleName} />
        </header>

        <div className="mt-6 space-y-3">
          {isBeginner && (
            <Note>
              We built this assuming you're <strong>starting fresh</strong> — mark any stop below \u201cI already know this\u201d to trim the road.
            </Note>
          )}

          {payload.target.unreadableLink && (
            <Note tone="warn">
              We couldn't read a job link you added — the site may block automated reading. This plan is built from your
              background and any other materials, <strong>not</strong> that posting. Paste the job description text in
              section 2 to target the exact role and company.
            </Note>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={enterWorkspace}
            className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            {(() => {
              const next = modules.find((m, i) => !done.has(i) && !trims.includes(i));
              return next?.task?.timebox ? `Start your first stop — ${next.task.timebox} →` : "Enter your workspace →";
            })()}
          </button>
          <button type="button" onClick={onBack} className="text-sm font-medium text-ink-soft hover:text-ink">
            ← Back to edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full fade-up lg:flex lg:h-[calc(100dvh-7rem)] lg:min-h-0 lg:flex-col">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <header className="border-b border-brand-100 px-4 py-4 sm:px-6 lg:shrink-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="t-label text-brand-600">Workspace home</p>
              <h1 className="mt-1 text-lg font-semibold leading-tight text-ink">{planTitle}</h1>
              <p className="mt-1 max-w-3xl truncate text-sm text-ink-soft">{missionLine}</p>
            </div>
            <div className="shrink-0 space-y-2 lg:w-64">
              <ProgressBar modules={modules} done={done} momentsByTask={momentsByTask} drafts={drafts} compact />
              <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={reopenBriefing}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink-soft ring-1 ring-slate-200 hover:text-ink"
                >
                  Briefing
                </button>
                <button
                  type="button"
                  id="why-this-plan-trigger"
                  aria-expanded={whyOpen}
                  onClick={() => setWhyOpen(true)}
                  className="relative rounded-full bg-white px-3 py-1 text-xs font-medium text-ink-soft ring-1 ring-slate-200 hover:text-ink"
                >
                  Why this plan?
                  {checkFailures > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500" aria-label="Self-check needs review" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {payload.target.unreadableLink && !workspaceWarningDismissed && (
            <div className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <p>
                Job link unreadable — this workspace uses your background and provided materials, not that blocked page.
              </p>
              <button
                type="button"
                onClick={() => setWorkspaceWarningDismissed(true)}
                className="shrink-0 font-semibold text-amber-800 hover:text-amber-950"
              >
                Dismiss
              </button>
            </div>
          )}
          {welcomeBack && (
            <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs text-ink-soft ring-1 ring-brand-100">
              {welcomeBack}
            </p>
          )}
        </header>

        <div className="grid gap-4 p-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[280px_minmax(0,1fr)] lg:overflow-hidden lg:p-6">
          <aside className="min-w-0 space-y-3 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            <ProjectFolder
              modules={modules}
              activeIndex={activeIndex}
              done={done}
              drafts={drafts}
              draftMeta={draftMeta}
              momentsByTask={momentsByTask}
              firstIncompleteIndex={firstIncompleteIndex}
              futureOverrides={futureOverrides}
              pendingFuture={pendingFuture}
              allTasksDone={allTasksDone}
              activeSurface={activeSurface}
              projectTitle={planTitle}
              onSelect={openTask}
              onStartAnyway={openFutureAnyway}
              onGoRecommended={goToRecommendedTask}
              onCapstone={openCapstone}
              onCapstoneAnyway={openCapstoneAnyway}
            />
          </aside>
          <div ref={taskPanelRef} className="min-w-0 scroll-mt-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            {activeSurface === "capstone" ? (
              <ReadinessProject
                firstTask={plan.firstTask}
                hasRealTask={!!form.headed.realTask?.trim()}
                deadline={deadline}
                timelineNote={plan.timelineNote}
                modules={modules}
                drafts={drafts}
                done={done}
                projectTitle={planTitle}
                gapCount={getClosedGapCount(plan, modules, done)}
                embedded
              />
            ) : (
              activeModule && (
                <Module
                  i={activeIndex}
                  total={modules.length}
                  step={activeModule}
                  plan={plan}
                  modules={modules}
                  done={done}
                  roleName={roleName}
                  resources={topicResources[activeIndex]}
                  resourcesDone={resourcesDone}
                  isDone={done.has(activeIndex)}
                  onComplete={() => completeAndAdvance(activeIndex)}
                  draft={drafts[activeIndex] || ""}
                  onDraftChange={(draft) => setTaskDraft(activeIndex, draft)}
                  nextLabel={modules[activeIndex + 1]?.task?.title || modules[activeIndex + 1]?.topic || ""}
                  momentIndex={momentsByTask[activeIndex] || 0}
                  onMomentChange={(momentIndex) => {
                    setWelcomeBack(null);
                    setTaskMoment(activeIndex, momentIndex);
                  }}
                  checks={checksByTask[activeIndex] || []}
                  onToggleCheck={(key) => toggleTaskCheck(activeIndex, key)}
                />
              )
            )}
            {augmenting && (
              <p className="mt-3 text-xs text-ink-faint">Adding optional explanations to thin tasks…</p>
            )}
          </div>
        </div>
      </section>

      {whyOpen && (
        <PlanDrawer
          plan={plan}
          check={check}
          checking={checking}
          payload={payload}
          showPayload={showPayload}
          onTogglePayload={() => setShowPayload((s) => !s)}
          onBack={onBack}
          onClose={() => {
            setWhyOpen(false);
            // a11y: return focus to the trigger that opened the dialog (after
            // React has removed the dialog — rAF fires too early and loses the race).
            setTimeout(() => document.getElementById("why-this-plan-trigger")?.focus(), 50);
          }}
        />
      )}
    </div>
  );
}

function NodeResources({ resources, done }) {
  if (!done) {
    return <p className="text-xs text-ink-faint">Finding extra explanations for this task…</p>;
  }
  if (!resources?.length) {
    return (
      <p className="text-xs italic text-ink-faint">
        Everything you need to do this is above — no outside reading required.
      </p>
    );
  }
  return (
    <details className="group rounded-lg border border-slate-100 bg-white px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs text-ink-soft">
        <span>
          <span className="font-semibold uppercase tracking-wide text-ink-faint">Need another explanation?</span>
          <span className="ml-2 text-ink-faint">
            {resources.length} analyst-vetted source{resources.length === 1 ? "" : "s"}
          </span>
        </span>
        <span className="text-ink-faint transition-transform group-open:rotate-180">▾</span>
      </summary>
      <ul className="mt-3 space-y-3 border-t border-slate-100 pt-3">
        {resources.map((r, k) => (
          <li key={k} className="text-sm">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs uppercase tracking-wide text-ink-faint">
                {r.kind || "resource"}
              </span>
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-500"
              >
                {r.title}
              </a>
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                ✓ {r.source}
              </span>
            </div>
            {(r.use || r.why) && (
              <div className="mt-1 text-xs leading-relaxed text-ink-soft">{r.use || r.why}</div>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

function ProjectFolder({
  modules,
  activeIndex,
  done,
  drafts,
  draftMeta,
  momentsByTask,
  firstIncompleteIndex,
  futureOverrides,
  pendingFuture,
  allTasksDone,
  activeSurface,
  projectTitle,
  onSelect,
  onStartAnyway,
  onGoRecommended,
  onCapstone,
  onCapstoneAnyway,
}) {
  const [openPreview, setOpenPreview] = useState(null);
  const files = modules.map((m, i) => deliverableName(m, i));

  // a11y: Escape closes an open file preview and returns focus to its file row.
  useEffect(() => {
    if (openPreview === null) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      const i = openPreview;
      setOpenPreview(null);
      requestAnimationFrame(() => document.getElementById(`file-row-${i}`)?.focus());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPreview]);

  if (!files.length) return null;
  const firstOpenLabel =
    firstIncompleteIndex < modules.length ? `Task ${firstIncompleteIndex + 1}` : `Task ${modules.length}`;
  const taskState = (m, i) => {
    const meta = getMomentMeta(m);
    const savedMoment = Math.min(Number(momentsByTask[i] || 0), Math.max(0, meta.length - 1));
    const draft = drafts[i] || "";
    const editedAt = Number(draftMeta?.[i] || 0);
    const editedLabel = editedAt ? ` · edited ${formatShortDate(editedAt)}` : "";
    const cleanDraft = draft.trim();
    const hasDraft = !!cleanDraft;
    const isDone = done.has(i);
    const isFuture =
      firstIncompleteIndex < modules.length && i > firstIncompleteIndex && !futureOverrides.has(i) && !isDone;
    const navStatus = savedMoment > 0 ? `resume at ${meta[savedMoment]?.label || "Brief"} ${savedMoment + 1}/${meta.length}` : "";
    const words = wordCount(cleanDraft);
    const artifactState = isDone
      ? {
          mark: "✓",
          label: "final",
          line: words ? `${words} word${words === 1 ? "" : "s"}` : "no draft",
          tone: "final",
        }
      : hasDraft
        ? {
            mark: "●",
            label: "draft",
            line: `${shorten(cleanDraft, 60)} · ${words} word${words === 1 ? "" : "s"}`,
            tone: "draft",
          }
        : {
            mark: "○",
            label: "outlined",
            line: "not yet created",
            tone: "outlined",
          };
    const baseStatus = `${artifactState.mark} ${artifactState.label}, ${artifactState.line}${editedLabel}`;
    const status = navStatus ? `${baseStatus} · ${navStatus}` : baseStatus;
    return { meta, savedMoment, draft, cleanDraft, hasDraft, isDone, isFuture, status, artifactState, words, editedAt };
  };

  const openFilePreview = (i) => {
    const state = taskState(modules[i], i);
    if (state.isFuture) {
      setOpenPreview(null);
      onSelect(i);
      return;
    }
    setOpenPreview((current) => (current === i ? null : i));
  };

  const continueFromPreview = (i) => {
    setOpenPreview(null);
    onSelect(i);
  };

  const projectMarkdown = buildProjectMarkdown(projectTitle, modules, files, drafts, done);
  const projectHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(projectMarkdown)}`;
  const canDownload = hasAnyDraft(drafts);
  const draftStats = getDraftStats(modules, drafts);
  const downloadLabel = `Download my project — ${draftStats.drafted} of ${modules.length} files drafted · ${draftStats.words} word${draftStats.words === 1 ? "" : "s"}`;

  const renderConfirm = (i) => (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <p>We recommend finishing {firstOpenLabel} first — start anyway?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => onStartAnyway(i)} className="rounded bg-white px-2 py-1 font-medium ring-1 ring-amber-200">
          Start anyway
        </button>
        <button type="button" onClick={onGoRecommended} className="rounded px-2 py-1 font-medium text-amber-800 hover:bg-white/70">
          Go to {firstOpenLabel}
        </button>
      </div>
    </div>
  );

  const renderCapstoneConfirm = () => (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <p>We recommend finishing {firstOpenLabel} first — start anyway?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={onCapstoneAnyway} className="rounded bg-white px-2 py-1 font-medium ring-1 ring-amber-200">
          Start anyway
        </button>
        <button type="button" onClick={onGoRecommended} className="rounded px-2 py-1 font-medium text-amber-800 hover:bg-white/70">
          Go to {firstOpenLabel}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {modules.map((m, i) => {
            const state = taskState(m, i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelect(i)}
                className={`flex h-10 min-w-10 items-center justify-center rounded-full border text-xs font-semibold transition ${
                  activeSurface === "task" && activeIndex === i
                    ? "border-brand-300 bg-white text-brand-700"
                    : "border-slate-200 bg-white/70 text-ink-soft"
                } ${state.isFuture ? "opacity-45" : ""}`}
                title={state.status}
              >
                {state.isDone ? "✓" : activeIndex === i ? "●" : i + 1}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onCapstone}
            className={`flex h-10 min-w-[4.5rem] items-center justify-center rounded-full border px-3 text-xs font-semibold transition ${
              activeSurface === "capstone"
                ? "border-brand-300 bg-white text-brand-700"
                : allTasksDone || futureOverrides.has("capstone")
                  ? "border-brand-200 bg-white text-brand-700"
                : "border-slate-200 bg-white/70 text-ink-soft opacity-45"
            }`}
            title="Readiness project"
          >
            Project
          </button>
        </div>
        {typeof pendingFuture === "number" && renderConfirm(pendingFuture)}
        {pendingFuture === "capstone" && renderCapstoneConfirm()}
      </div>

      <div className="hidden rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 lg:block">
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Project workspace</p>
            <p className="mt-1 text-sm text-ink-soft">Your first-assignment files.</p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs text-ink-faint ring-1 ring-slate-200">
            {files.length} files
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {files.map((file, i) => {
            const state = taskState(modules[i], i);
            return (
              <div key={i}>
                <button
                  type="button"
                  id={`file-row-${i}`}
                  aria-expanded={openPreview === i}
                  aria-current={activeSurface === "task" && activeIndex === i ? "true" : undefined}
                  onClick={() => openFilePreview(i)}
                  className={`flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-xs ring-1 transition ${
                    activeIndex === i
                    && activeSurface === "task"
                      ? "bg-white text-ink ring-brand-200"
                      : "bg-white/70 text-ink-soft ring-slate-100 hover:ring-brand-100"
                  } ${state.isFuture ? "opacity-50" : ""}`}
                >
                  <span
                    className={
                      state.artifactState.tone === "final"
                        ? "mt-1 text-emerald-600"
                        : state.artifactState.tone === "draft"
                          ? "mt-1 text-amber-500"
                          : "mt-1 text-ink-faint"
                    }
                  >
                    {state.artifactState.mark}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{file}</span>
                    <span className="mt-1 block text-xs leading-snug text-ink-faint">{state.status}</span>
                    {state.isFuture && (
                      <span className="mt-1 block text-xs leading-snug text-ink-faint">
                        Builds on Task {firstIncompleteIndex + 1}'s {dependencyName(modules, firstIncompleteIndex)}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-ink-faint">{state.isFuture ? "Open →" : openPreview === i ? "Close" : "Preview"}</span>
                </button>
                {openPreview === i && (
                  <FilePreview
                    file={file}
                    draft={state.cleanDraft}
                    editedAt={state.editedAt}
                    isDone={state.isDone}
                    onContinue={() => continueFromPreview(i)}
                  />
                )}
                {pendingFuture === i && renderConfirm(i)}
              </div>
            );
          })}
          <div>
            <button
              type="button"
              onClick={onCapstone}
              className={`flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-xs ring-1 transition ${
                activeSurface === "capstone"
                  ? "bg-white text-ink ring-brand-200"
                  : allTasksDone || futureOverrides.has("capstone")
                    ? "bg-white/70 text-ink-soft ring-brand-100 hover:ring-brand-200"
                  : "bg-white/60 text-ink-soft opacity-50 ring-slate-100 hover:ring-brand-100"
              }`}
            >
              <span className="mt-1 text-brand-500">★</span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Readiness project</span>
                <span className="mt-1 block text-xs leading-snug text-ink-faint">
                  {allTasksDone ? "Ready to review" : `Builds on all ${modules.length} tasks`}
                </span>
              </span>
              <span className="shrink-0 text-ink-faint">Open →</span>
            </button>
            {pendingFuture === "capstone" && renderCapstoneConfirm()}
          </div>
        </div>
        <div className="mt-4 border-t border-slate-200 pt-3">
          {canDownload ? (
            <a
              href={projectHref}
              download="labbridge-project.md"
              className="block w-full rounded-lg bg-white px-3 py-2 text-center text-xs font-semibold text-ink ring-1 ring-slate-200 transition hover:ring-brand-200"
            >
              {downloadLabel}
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Write something first — your drafts become the download."
              className="w-full cursor-not-allowed rounded-lg bg-white px-3 py-2 text-xs font-semibold text-ink-faint opacity-60 ring-1 ring-slate-200"
            >
              {downloadLabel}
            </button>
          )}
          <p className="mt-2 text-xs leading-snug text-ink-faint">These files become your readiness project.</p>
        </div>
      </div>
    </>
  );
}

function FilePreview({ file, draft, editedAt, isDone, onContinue }) {
  const fileHref = draft ? buildFileMarkdownHref(file, draft) : null;
  return (
    <div className="mt-2 rounded-lg border border-brand-100 bg-white px-3 py-3 text-xs shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all font-semibold text-ink">{file}</p>
          <p className="mt-1 text-xs text-ink-faint">{draft ? `${wordCount(draft)} word${wordCount(draft) === 1 ? "" : "s"}` : "empty draft"}</p>
          {editedAt ? <p className="mt-1 text-xs text-ink-faint">Last edited {formatFullDateTime(editedAt)}</p> : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={onContinue}
            className="rounded bg-brand-50 px-2 py-1 font-semibold text-brand-700 ring-1 ring-brand-100 hover:bg-brand-100"
          >
            {isDone ? "Reopen →" : "Continue →"}
          </button>
          {fileHref && (
            <a
              href={fileHref}
              download={`${file}.md`}
              className="rounded bg-white px-2 py-1 text-center font-semibold text-ink-soft ring-1 ring-slate-200 hover:ring-brand-200"
            >
              Download
            </a>
          )}
        </div>
      </div>
      {draft ? (
        <div className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 px-3 py-2 leading-relaxed text-ink-soft">
          {draft}
        </div>
      ) : (
        <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 leading-relaxed text-ink-faint">
          Nothing written yet — the Artifact moment is where this file gets made.
        </p>
      )}
    </div>
  );
}

function TaskTabs({ modules, activeIndex, done, onSelect }) {
  if (!modules.length) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Tasks</p>
      <div className="mt-2 grid gap-2">
        {modules.map((m, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
              activeIndex === i
                ? "border-brand-300 bg-brand-50 text-ink"
                : "border-slate-200 bg-white text-ink-soft hover:border-brand-200 hover:bg-brand-50/40"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                done.has(i)
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : activeIndex === i
                    ? "border-brand-300 bg-white text-brand-700"
                    : "border-slate-300 text-ink-faint"
              }`}
            >
              {done.has(i) ? "✓" : i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium leading-snug">Task {i + 1}</span>
              <span className="block truncate text-xs">{m.task?.title || m.topic}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Stable per-plan key so checkpoint progress survives a refresh.
function planKey(seq) {
  const s = (seq || []).map((x) => x.topic).join("|");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return "lb_progress_" + (h >>> 0).toString(36);
}

function scopedPlanKey(prefix, seq) {
  return `${prefix}_${planKey(seq)}`;
}

function formatShortDate(epochMs) {
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullDateTime(epochMs) {
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}, ${date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}

function getMomentMeta(step) {
  const task = step?.task || {};
  const concept = step?.concept || {};
  const example = step?.workedExample || {};
  const moments = [{ key: "brief", label: "Brief", objective: "Why am I here?" }];
  if (step?.comprehensionCheck?.question && step.comprehensionCheck.options?.length) {
    moments.push({ key: "question", label: "Check", objective: "Can I try first?" });
  }
  if (concept.explanation) moments.push({ key: "model", label: "Model", objective: "What's the idea?" });
  if (example.setup) moments.push({ key: "visual", label: "Example", objective: "What does it look like?" });
  if (task.steps?.length) moments.push({ key: "practice", label: "Try", objective: "Can I do it myself?" });
  moments.push(
    { key: "coach", label: "Coach", objective: "Am I right?" },
    { key: "artifact", label: "Draft", objective: "What did I produce?" },
    { key: "reward", label: "Wrap", objective: "What changed in my project?" }
  );
  return moments;
}

function dependencyName(modules, index) {
  if (index < 0 || index >= modules.length) return "previous work";
  return shorten(deliverableName(modules[index], index), 36);
}

function wordCount(s) {
  const words = (s || "").trim().match(/\S+/g);
  return words ? words.length : 0;
}

function hasAnyDraft(drafts) {
  return Object.values(drafts || {}).some((draft) => (draft || "").trim());
}

function getDraftStats(modules, drafts) {
  return (modules || []).reduce(
    (acc, _m, i) => {
      const draft = (drafts[i] || "").trim();
      if (draft) {
        acc.drafted += 1;
        acc.words += wordCount(draft);
        acc.files.push(deliverableName(modules[i], i));
      }
      return acc;
    },
    { drafted: 0, words: 0, files: [] }
  );
}

function buildFileMarkdownHref(file, draft) {
  const markdown = `# ${file}\n\n${draft}`;
  return `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`;
}

function getWelcomeBack(modules, done, drafts, momentsByTask) {
  const hasProgress =
    done.size > 0 ||
    Object.values(drafts || {}).some((draft) => (draft || "").trim()) ||
    Object.values(momentsByTask || {}).some((moment) => Number(moment) > 0);
  if (!hasProgress) return null;
  const inProgress = (modules || []).findIndex((m, i) => {
    if (done.has(i)) return false;
    return Number(momentsByTask[i] || 0) > 0 || !!(drafts[i] || "").trim();
  });
  if (inProgress >= 0) {
    const meta = getMomentMeta(modules[inProgress]);
    const savedMoment = Math.min(Number(momentsByTask[inProgress] || 0), Math.max(0, meta.length - 1));
    const beat = meta[savedMoment]?.label || "Brief";
    const title = modules[inProgress]?.task?.title || modules[inProgress]?.topic || `Task ${inProgress + 1}`;
    return `You left off mid-${title} — ${beat} is next.`;
  }
  const firstIncomplete = (modules || []).findIndex((_, i) => !done.has(i));
  if (firstIncomplete >= 0) {
    const title = modules[firstIncomplete]?.task?.title || modules[firstIncomplete]?.topic || `Task ${firstIncomplete + 1}`;
    return `Next up: ${title}.`;
  }
  return null;
}

function getGapMappings(modules, gapCount) {
  return (modules || [])
    .map((m, taskIndex) => ({ taskIndex, gapIndex: Number(m.closesGapIndex) }))
    .filter(({ gapIndex }) => Number.isInteger(gapIndex) && gapIndex >= 0 && gapIndex < gapCount);
}

function isGapClosed(gapIndex, mappings, done) {
  const tasksForGap = mappings.filter((m) => m.gapIndex === gapIndex).map((m) => m.taskIndex);
  return tasksForGap.length > 0 && tasksForGap.every((taskIndex) => done.has(taskIndex));
}

function getClosedGapCount(plan, modules, done) {
  const gaps = plan?.knowledgeGaps || [];
  const mappings = getGapMappings(modules, gaps.length);
  if (!mappings.length) return 0;
  return gaps.filter((_, gapIndex) => isGapClosed(gapIndex, mappings, done)).length;
}

function getGapClosedReward(plan, modules, done, doneAsIf, taskIndex, roleName) {
  const gaps = plan?.knowledgeGaps || [];
  const gapIndex = Number(modules?.[taskIndex]?.closesGapIndex);
  if (!Number.isInteger(gapIndex) || gapIndex < 0 || gapIndex >= gaps.length) return null;
  const mappings = getGapMappings(modules, gaps.length);
  const wasClosed = isGapClosed(gapIndex, mappings, done);
  const isClosed = isGapClosed(gapIndex, mappings, doneAsIf);
  if (wasClosed || !isClosed) return null;
  return {
    gap: cleanPoint(gaps[gapIndex]?.point || ""),
    role: roleName || "the role",
  };
}

function getFinalMirrorReward(plan, modules, roleName) {
  const gaps = plan?.knowledgeGaps || [];
  const mappings = getGapMappings(modules, gaps.length);
  const files = (modules || []).map((m, i) => deliverableName(m, i));
  return {
    before:
      mappings.length > 0
        ? `${gaps.length} gap${gaps.length === 1 ? "" : "s"} stood between you and ${roleName || "the role"}.`
        : `You arrived with ${gaps.length} gap${gaps.length === 1 ? "" : "s"} to close.`,
    now: `${files.length} file${files.length === 1 ? "" : "s"} in your project prove otherwise — ${files.join(" · ")}.`,
  };
}

function buildProjectMarkdown(projectTitle, modules, files, drafts, done) {
  const lines = [
    `# ${projectTitle || "LabBridge project"}`,
    "",
    "Exported from LabBridge project workspace.",
    "",
  ];
  modules.forEach((m, i) => {
    const draft = (drafts[i] || "").trim();
    const status = done.has(i) ? "final" : draft ? "draft" : "outlined";
    const title = m.task?.title || m.topic || `Task ${i + 1}`;
    lines.push(`# ${files[i]}`, "", title, "", `Status: ${status}`, "", draft || "_Not written yet._", "");
  });
  return lines.join("\n");
}

function ProgressBar({ modules = [], done = new Set(), momentsByTask = {}, drafts = {}, compact = false }) {
  const total = modules.length;
  const doneCount = done.size;
  /* a11y: expose the earned count to assistive tech. */
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={doneCount} aria-label={`${doneCount} of ${total} project files built`}>
      <div className="text-xs text-ink-soft">
        {total > 0 && doneCount >= total ? (
          <span>All {total} files built — your readiness project is open ★</span>
        ) : (
          <span>
            {doneCount} of {total} project file{total === 1 ? "" : "s"} built
          </span>
        )}
      </div>
      <div className={`${compact ? "mt-1 h-2" : "mt-1 h-2.5"} flex w-full gap-1`}>
        {modules.map((m, i) => {
          const meta = getMomentMeta(m);
          const savedMoment = Math.min(Number(momentsByTask[i] || 0), Math.max(0, meta.length - 1));
          const hasDraft = !!(drafts[i] || "").trim();
          const isDone = done.has(i);
          const partial = !isDone && (savedMoment > 0 || hasDraft);
          const partialPct = partial ? Math.max(34, Math.round(((savedMoment + 1) / Math.max(1, meta.length)) * 100)) : 0;
          return (
            <div key={i} className="h-full min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
              <div
                className={`h-full rounded-full transition-all ${
                  isDone ? "bg-brand-500" : partial ? "bg-brand-200" : "bg-transparent"
                }`}
                style={{ width: isDone ? "100%" : partial ? `${partialPct}%` : "0%" }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Module({
  i,
  total,
  step,
  plan,
  modules,
  done,
  roleName,
  resources,
  resourcesDone,
  isDone,
  onComplete,
  draft,
  onDraftChange,
  nextLabel,
  momentIndex,
  onMomentChange,
  checks,
  onToggleCheck,
}) {
  const t = step.task || {};
  const c = step.concept || {};
  const ex = step.workedExample || {};
  const sc = step.selfCheck || {};
  return (
    <section
      className={`overflow-hidden rounded-xl border transition ${
        isDone ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
        <span
          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${
            isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-ink-faint"
          }`}
        >
            {isDone ? "✓" : i + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 t-label text-brand-600">
            Task {i + 1}{total ? ` of ${total}` : ""}
          </div>
          <div className={`text-base font-semibold leading-snug ${isDone ? "text-ink-soft line-through" : "text-ink"}`}>
            {t.title || step.topic}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{shorten(step.why, 150)}</p>
        </div>
      </div>
      <MomentFlow
        moduleIndex={i}
        step={step}
        plan={plan}
        modules={modules}
        done={done}
        roleName={roleName}
        task={t}
        concept={c}
        example={ex}
        selfCheck={sc}
        resources={resources}
        resourcesDone={resourcesDone}
        isDone={isDone}
        onComplete={onComplete}
        draft={draft}
        onDraftChange={onDraftChange}
        nextLabel={nextLabel}
        momentIndex={momentIndex}
        onMomentChange={onMomentChange}
        checks={checks}
        onToggleCheck={onToggleCheck}
      />
    </section>
  );
}

function MomentFlow({
  moduleIndex,
  step,
  plan,
  modules,
  done,
  roleName,
  task,
  concept,
  example,
  selfCheck,
  resources,
  resourcesDone,
  isDone,
  onComplete,
  draft,
  onDraftChange,
  nextLabel,
  momentIndex,
  onMomentChange,
  checks,
  onToggleCheck,
}) {
  const [choice, setChoice] = useState(null);
  const checkSet = new Set(checks || []);
  const moments = buildMoments({
    step,
    plan,
    modules,
    done,
    roleName,
    task,
    concept,
    example,
    selfCheck,
    resources,
    resourcesDone,
    draft,
    onDraftChange,
    choice,
    setChoice,
    moduleIndex,
    comprehension: step.comprehensionCheck,
    checks: checkSet,
    toggleCheck: onToggleCheck,
    nextLabel,
    isDone,
  });
  const moment = Math.min(momentIndex || 0, Math.max(0, moments.length - 1));
  const current = moments[moment] || moments[0];

  useEffect(() => {
    setChoice(null);
  }, [moduleIndex]);

  const goNext = () => {
    if (moment < moments.length - 1) onMomentChange(moment + 1);
    else if (!isDone) onComplete();
  };

  // a11y: ←/→ walk the moments. Skip while typing or when a dialog (drawer) is up.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.target.closest?.("input, textarea, select, [role='dialog']")) return;
      if (e.key === "ArrowLeft" && moment > 0) onMomentChange(moment - 1);
      if (e.key === "ArrowRight" && moment < moments.length - 1) onMomentChange(moment + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moment, moments.length, onMomentChange]);

  return (
    <div className="bg-slate-50/60">
      <div className="border-b border-slate-100 bg-white px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {current.label} — {current.objective}
          </p>
          <p className="text-xs text-ink-faint">{moment + 1}/{moments.length}</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${((moment + 1) / moments.length) * 100}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-8">
          {moments.map((m, idx) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onMomentChange(idx)}
              aria-label={`Open ${m.label}`}
              aria-current={idx === moment ? "step" : undefined}
              title={m.label}
              className="flex h-10 -my-3 items-center"
            >
              <span
                className={`h-1.5 w-full rounded-full transition ${
                  idx === moment ? "bg-brand-500" : idx < moment ? "bg-brand-200" : "bg-slate-200"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="min-h-[360px] rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-ink">{current.title}</h3>
          {current.kicker && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{current.kicker}</p>}
          <div className="mt-6">{current.body}</div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onMomentChange(Math.max(0, moment - 1))}
            disabled={moment === 0}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-ink-soft disabled:opacity-40"
          >
            Back
          </button>
          <span className="hidden text-xs text-ink-faint sm:inline">{current.objective}</span>
          <button
            type="button"
            onClick={goNext}
            className={`rounded-lg px-4 py-2 text-xs font-semibold ${
              moment === moments.length - 1
                ? "bg-emerald-600 text-white"
                : "bg-brand-500 text-white hover:bg-brand-600"
            }`}
          >
            {moment === moments.length - 1
              ? nextLabel
                ? `Start Task ${moduleIndex + 2} →`
                : "Finish — review your project →"
              : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

function buildMoments({
  step,
  plan,
  modules,
  done,
  roleName,
  task,
  concept,
  example,
  selfCheck,
  resources,
  resourcesDone,
  draft,
  onDraftChange,
  choice,
  setChoice,
  moduleIndex,
  comprehension,
  checks,
  toggleCheck,
  nextLabel,
  isDone,
}) {
  // Fixed grammar, variable inclusion. Code assembles the beats a task has content
  // for: Brief/Coach/Artifact/Reward always; Question/Model/Visual/Practice when
  // their content exists. The model never chooses the flow.
  const artifact = deliverableName(step, moduleIndex);
  const criteria = selfCheck.criteria || [];
  const redFlags = selfCheck.redFlags || [];
  const answered = choice !== null && choice !== undefined;
  const moments = [];

  // BRIEF — Why am I here?
  moments.push({
    key: "brief",
    label: "Brief",
    title: task.title || step.topic,
    objective: "Why am I here?",
    kicker: "Start with the job, not the lesson.",
    body: (
      <div className="space-y-4">
        {task.managerRequest && (
          <blockquote className="max-w-prose border-l-2 border-brand-300 pl-4 t-body italic text-ink">
            “{task.managerRequest}”
          </blockquote>
        )}
        <div className="rounded-lg bg-brand-50 px-4 py-3">
          <p className="t-label text-brand-600">Your goal</p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-ink">{task.deliverable || artifact}</p>
        </div>
        {task.givenInputs?.length > 0 && (
          <p className="text-sm leading-relaxed text-ink-soft">
            <span className="font-medium text-ink">You're given:</span> {task.givenInputs.join(", ")}
          </p>
        )}
        {task.stakeholders && (
          <p className="text-sm leading-relaxed text-ink-soft">
            <span className="font-medium text-ink">Who uses it:</span> {task.stakeholders}
          </p>
        )}
      </div>
    ),
  });

  // QUESTION — Can I try first? (only if a real check exists)
  if (comprehension?.question && comprehension.options?.length) {
    moments.push({
      key: "question",
      label: "Check",
      title: comprehension.question,
      objective: "Can I try first?",
      kicker: "Take a guess before the model — the first try is what makes it stick.",
      body: (
        <div className="space-y-3">
          <div className="grid gap-2">
            {comprehension.options.map((o, idx) => {
              const isSel = choice === idx;
              const isCorrect = idx === comprehension.answerIndex;
              const cls = !answered
                ? "border-slate-200 bg-white text-ink-soft hover:border-brand-200 hover:text-ink"
                : isCorrect
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : isSel
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-slate-200 bg-white text-ink-faint";
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setChoice(idx)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition ${cls}`}
                >
                  {o}
                </button>
              );
            })}
          </div>
          {answered && (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                choice === comprehension.answerIndex ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
              }`}
            >
              {choice === comprehension.answerIndex ? "Correct. " : "Not quite. "}
              {comprehension.explanation}
            </p>
          )}
        </div>
      ),
    });
  }

  // MODEL — What's the idea? (full concept, no truncation)
  if (concept.explanation) {
    moments.push({
      key: "model",
      label: "Model",
      title: "The idea you need.",
      objective: "What's the idea?",
      kicker: "One compact model — short enough to use while working.",
      body: (
        <div className="space-y-4">
          <p className="max-w-prose whitespace-pre-line t-body text-ink">{concept.explanation}</p>
          {concept.keyTerms?.length > 0 && (
            <dl className="border-t border-slate-100 pt-2">
              {concept.keyTerms.map((k, j) => (
                <div key={j} className="py-0.5 text-xs">
                  <dt className="inline font-semibold text-ink">{k.term}</dt>
                  <dd className="inline text-ink-soft"> — {k.plainMeaning}</dd>
                </div>
              ))}
            </dl>
          )}
          {concept.misconceptionToAvoid && (
            <p className="rounded-md border-l-2 border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
              <span className="font-medium">Common mistake:</span> {concept.misconceptionToAvoid}
            </p>
          )}
          {step.bridgeFromBackground && (
            <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm italic leading-relaxed text-brand-700">
              ↪ {step.bridgeFromBackground}
            </p>
          )}
        </div>
      ),
    });
  }

  // VISUAL — What does it look like? (worked example as a clean card)
  if (example.setup) {
    moments.push({
      key: "visual",
      label: "Example",
      title: "See it on one tiny case.",
      objective: "What does it look like?",
      kicker: null,
      body: (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="t-label text-ink-faint">The case</p>
            <p className="mt-1 max-w-prose whitespace-pre-line t-body text-ink">{example.setup}</p>
          </div>
          {example.walkThrough?.length > 0 && (
            <ol className="space-y-2">
              {example.walkThrough.map((s, k) => (
                <li
                  key={k}
                  className="flex max-w-prose gap-3 rounded-lg bg-white px-3 py-2 t-body text-ink ring-1 ring-slate-100"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-50 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
                    {k + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          )}
          {example.takeaway && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-ink-soft">
              <span className="font-medium text-ink">Takeaway:</span> {example.takeaway}
            </p>
          )}
        </div>
      ),
    });
  }

  // PRACTICE — Can I do it myself? (only if steps exist)
  if (task.steps?.length) {
    moments.push({
      key: "practice",
      label: "Try",
      title: "Make the first move.",
      objective: "Can I do it myself?",
      kicker: "Small action, real project.",
      body: (
        <div>
          <ol className="space-y-2">
            {task.steps.map((s, k) => (
              <li
                key={k}
                className="flex max-w-prose gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 t-body text-ink"
              >
                <span className="pt-0.5 text-brand-600">□</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          {task.givenInputs?.length > 0 && (
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              <span className="font-medium text-ink">Use:</span> {task.givenInputs.join(", ")}
            </p>
          )}
        </div>
      ),
    });
  }

  // COACH — Am I right? (honest self-check: the user ticks, nothing auto-responds)
  moments.push({
    key: "coach",
    label: "Coach",
    title: "Self-check first.",
    objective: "Am I right?",
    kicker: "Tick these against your own draft. It's ready for AI review when they all hold.",
    body: (
      <div className="space-y-3">
        {criteria.length > 0 && (
          <ul className="space-y-2">
            {criteria.map((cr, k) => {
              const on = checks.has(`c${k}`);
              return (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => toggleCheck(`c${k}`)}
                    className={`flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                      on ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-brand-200"
                    }`}
                  >
                    <span
                      className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs ${
                        on ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className={on ? "text-emerald-800" : "text-ink"}>{cr}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {redFlags.length > 0 && (
          <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100">
            <p className="t-label text-rose-600">Watch for</p>
            <ul className="mt-2 space-y-1">
              {redFlags.map((rf, k) => (
                <li key={k} className="flex gap-1.5 text-xs leading-relaxed text-ink-soft">
                  <span className="text-rose-500">△</span>
                  <span>{rf}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-ink-faint">
          AI review is coming — soon you'll be able to paste your draft and have LabBridge check it against these
          criteria. For now, judge it yourself.
        </p>
        {/* Demo-only coaching prototype — renders nothing in the real flow. */}
        <SampleCoaching draft={draft} criteria={criteria} checks={checks} redFlags={redFlags} concept={concept} task={task} />
      </div>
    ),
  });

  // ARTIFACT — What did I produce?
  moments.push({
    key: "artifact",
    label: "Draft",
    title: "Write your draft.",
    objective: "What did I produce?",
    kicker: "This is where it becomes yours — part of your final project.",
    body: (
      <div className="space-y-3">
        <WorkspacePanel step={step} moduleIndex={moduleIndex} draft={draft} onDraftChange={onDraftChange} />
        {task.doneWhen && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm leading-relaxed text-emerald-800">
            <span className="font-medium">Done when:</span> {task.doneWhen}
          </p>
        )}
        <NodeResources resources={resources} done={resourcesDone} />
      </div>
    ),
  });

  // REWARD — What changed in my project? (reads live state)
  const ticked = criteria.filter((_, k) => checks.has(`c${k}`)).length;
  const hasDraft = (draft || "").trim().length > 0;
  const doneAsIf = new Set(done || []);
  doneAsIf.add(moduleIndex);
  const gapReward = getGapClosedReward(plan, modules, done || new Set(), doneAsIf, moduleIndex, roleName);
  const mirrorReward = doneAsIf.size >= (modules || []).length
    ? getFinalMirrorReward(plan, modules, roleName)
    : null;
  moments.push({
    key: "reward",
    label: "Wrap",
    title: isDone ? "Task complete." : "Add it to your project.",
    objective: "What changed in my project?",
    kicker: null,
    body: (
      <div className="space-y-3">
        {gapReward && <GapClosedReward reward={gapReward} />}
        {/* Visual-design spec §5: the Wrap is a work RECEIPT — line items, no banner energy. */}
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="px-4 py-3">
            <p className="t-label text-ink-faint">Added to your project</p>
            <p className="mt-1 t-mono font-medium text-ink">{artifact}</p>
            <p className="mt-1 text-xs text-ink-soft">
              {hasDraft ? "Draft saved." : "Draft still empty — you can add it any time."}
            </p>
          </div>
          {criteria.length > 0 && (
            <p className="px-4 py-3 text-sm text-ink-soft">
              <span className="font-medium text-ink">Self-check:</span> {ticked}/{criteria.length} confirmed
              {ticked < criteria.length ? " — a few still open, but you can move on." : " — all clear."}
            </p>
          )}
        </div>
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-ink">
          {nextLabel ? (
            <>
              <span className="font-medium">Next:</span> {nextLabel}
            </>
          ) : (
            "That's the last task — your project is assembled. The readiness project below is where you own it end-to-end."
          )}
        </p>
        {mirrorReward && <FinalMirrorReward reward={mirrorReward} />}
      </div>
    ),
  });

  return moments;
}

// Visual-design spec §5: the draft area is a small DOCUMENT, not a form field —
// mono filename strip, paper body, meta derived from real state. (This restyle
// also removed two unearned-state relics: a dead "Open →" button and a hardcoded
// checklist whose first item was always ✓.)
function WorkspacePanel({ step, moduleIndex, draft, onDraftChange }) {
  const file = deliverableName(step, moduleIndex);
  const words = wordCount(draft);
  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
        <p className="t-mono min-w-0 break-all text-xs font-medium text-ink">{file}</p>
        <p className="shrink-0 text-xs text-ink-faint">
          {words ? `Saved · ${words} word${words === 1 ? "" : "s"}` : "Not started"}
        </p>
      </div>
      <label className="block">
        <span className="sr-only">Draft for {file}</span>
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          rows={4}
          placeholder="Start writing the artifact here. What did you notice first?"
          className="w-full resize-y border-0 bg-white px-3 py-2 t-body text-ink focus:outline-none focus:ring-0"
        />
      </label>
    </div>
  );
}


function GapClosedReward({ reward }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
      <p className="text-sm font-semibold text-emerald-800">You closed a gap.</p>
      <p className="mt-1 text-sm text-emerald-800">
        <span className="text-ink-faint">□</span> <span className="mx-1 text-ink-faint">→</span>{" "}
        <span className="font-semibold">✓ {reward.gap}</span>
      </p>
      <p className="mt-1 text-xs leading-relaxed text-emerald-700">
        This stood between you and {reward.role}. It doesn't anymore.
      </p>
    </div>
  );
}

function FinalMirrorReward({ reward }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-sm text-ink">
        <span className="font-semibold">When you arrived:</span> {reward.before}
      </p>
      <p className="mt-1 text-sm text-ink">
        <span className="font-semibold">Now:</span> {reward.now}
      </p>
      <p className="mt-2 text-sm font-semibold text-brand-700">Your readiness project is open ★</p>
    </div>
  );
}

function CheckReview({ check, checking }) {
  // A quiet strip while the async check runs — never alarm the learner up front.
  if (!check) {
    return checking ? (
      <p className="px-1 text-xs text-ink-faint">Running a background self-check on the plan…</p>
    ) : null;
  }
  const ot = check.overteaching || {};
  const ft = check.firstTask || {};
  const known = ot.already_known || [];
  const otReview = ot.needs_review || [];
  const missing = ft.missing_prerequisites || [];
  const vague = ft.vague_points || [];
  const ftReview = ft.needs_review || [];
  const scope = (ft.scope_concern || "").trim();

  // Only GENUINE failures drive the visible signal; soft "maybe" flags live inside.
  const failures = missing.length + (scope ? 1 : 0) + vague.length;
  const soft = known.length + otReview.length + ftReview.length;
  if (!failures && !soft) {
    return <p className="px-1 text-xs text-emerald-700">✓ Plan self-check passed — no blocking gaps found.</p>;
  }
  const summary = failures
    ? `⚠ Plan self-check — ${failures} point${failures === 1 ? "" : "s"} worth a look before you start`
    : "Plan self-check — a few optional notes";

  return (
    <Collapse summary={summary} hint="details" defaultOpen={false}>
      <div className="space-y-3 text-sm">
        {missing.length > 0 && (
          <Finding tone="amber" title="The readiness project may need skills the plan didn't cover:">
            {missing.map((m, i) => (
              <li key={i}>
                <strong>{m.skill}</strong> — for “{m.task_part}”
              </li>
            ))}
          </Finding>
        )}
        {scope && (
          <Finding tone="amber" title="Scope concern:">
            <li>{scope}</li>
          </Finding>
        )}
        {vague.length > 0 && (
          <Finding tone="slate" title="Could be more concrete:">
            {vague.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </Finding>
        )}
        {known.length > 0 && (
          <Finding tone="slate" title="You may already know these — consider trimming:">
            {known.map((k, i) => (
              <li key={i}>
                <strong>{cleanTopic(k.node)}</strong> — <span className="text-ink-soft">{k.evidence}</span>
              </li>
            ))}
          </Finding>
        )}
        {(otReview.length > 0 || ftReview.length > 0) && (
          <Finding tone="slate" title="Worth a human glance:">
            {otReview.map((r, i) => (
              <li key={`o${i}`}>
                <strong>{cleanTopic(r.node)}</strong> — {r.reason}
              </li>
            ))}
            {ftReview.map((r, i) => (
              <li key={`f${i}`}>{r}</li>
            ))}
          </Finding>
        )}
      </div>
    </Collapse>
  );
}

function PlanDrawer({ plan, check, checking, payload, showPayload, onTogglePayload, onBack, onClose }) {
  const panelRef = useRef(null);

  // a11y: focus moves into the dialog on open, Escape closes, Tab stays inside;
  // focus returns to the trigger (see onClose wiring in PlanView).
  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll(
        "button, a[href], input, textarea, select, [tabindex]:not([tabindex='-1'])"
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label="Close why this plan"
        className="absolute inset-0 bg-ink/20"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Why this plan?"
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="mt-1 text-lg font-semibold text-ink">Why this plan?</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink-soft hover:text-ink"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <PlanReasoning plan={plan} />
          <section className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-4">
            <h3 className="text-sm font-semibold text-ink">Plan self-check</h3>
            <div className="mt-3">
              <PlanSelfCheckContent check={check} checking={checking} />
            </div>
          </section>
        </div>

        <div className="border-t border-slate-100 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={onBack} className="text-sm font-medium text-ink-soft hover:text-ink">
              ← Back to edit
            </button>
            <button type="button" onClick={onTogglePayload} className="text-xs text-ink-faint hover:text-ink-soft">
              {showPayload ? "Hide" : "Show"} what the generator received
            </button>
          </div>
          {showPayload && (
            <pre className="mt-3 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
              {JSON.stringify(payload, null, 2)}
            </pre>
          )}
        </div>
      </aside>
    </div>
  );
}

function PlanReasoning({ plan }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-4 py-4">
      <h3 className="text-sm font-semibold text-ink">
        The reasoning — built on {plan.transferableStrengths?.length || 0} transferable strength
        {plan.transferableStrengths?.length === 1 ? "" : "s"}, targeting {plan.knowledgeGaps?.length || 0} job-critical gap
        {plan.knowledgeGaps?.length === 1 ? "" : "s"}
      </h3>
      <div className="mt-4 space-y-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            What you already bring — and can skip
          </h4>
          <div className="mt-2">
            <PointList items={plan.transferableStrengths} />
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">What's actually missing</h4>
          <div className="mt-2">
            <PointList items={plan.knowledgeGaps} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PlanSelfCheckContent({ check, checking }) {
  if (!check) {
    return checking ? (
      <p className="text-xs text-ink-faint">Running a background self-check on the plan…</p>
    ) : (
      <p className="text-xs text-ink-faint">Self-check has not returned yet.</p>
    );
  }
  const ot = check.overteaching || {};
  const ft = check.firstTask || {};
  const known = ot.already_known || [];
  const otReview = ot.needs_review || [];
  const missing = ft.missing_prerequisites || [];
  const vague = ft.vague_points || [];
  const ftReview = ft.needs_review || [];
  const scope = (ft.scope_concern || "").trim();
  const failures = checkFailureCount(check);
  return (
    <div className="space-y-3 text-sm">
      {failures === 0 && (
        <p className="text-xs font-medium text-emerald-700">✓ Self-check passed — no blocking gaps found.</p>
      )}
      {missing.length > 0 && (
        <Finding tone="amber" title="The readiness project may need skills the plan didn't cover:">
          {missing.map((m, i) => (
            <li key={i}>
              <strong>{m.skill}</strong> — for “{m.task_part}”
            </li>
          ))}
        </Finding>
      )}
      {scope && (
        <Finding tone="amber" title="Scope concern:">
          <li>{scope}</li>
        </Finding>
      )}
      {vague.length > 0 && (
        <Finding tone="slate" title="Could be more concrete:">
          {vague.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </Finding>
      )}
      {known.length > 0 && (
        <Finding tone="slate" title="You may already know these — consider trimming:">
          {known.map((k, i) => (
            <li key={i}>
              <strong>{cleanTopic(k.node)}</strong> — <span className="text-ink-soft">{k.evidence}</span>
            </li>
          ))}
        </Finding>
      )}
      {(otReview.length > 0 || ftReview.length > 0) && (
        <Finding tone="slate" title="Worth a human glance:">
          {otReview.map((r, i) => (
            <li key={`o${i}`}>
              <strong>{cleanTopic(r.node)}</strong> — {r.reason}
            </li>
          ))}
          {ftReview.map((r, i) => (
            <li key={`f${i}`}>{r}</li>
          ))}
        </Finding>
      )}
    </div>
  );
}

function checkFailureCount(check) {
  if (!check) return 0;
  const ft = check.firstTask || {};
  return (ft.missing_prerequisites || []).length + ((ft.scope_concern || "").trim() ? 1 : 0) + (ft.vague_points || []).length;
}

// A lightweight, default-collapsed drawer — used for verification surfaces
// (the reasoning, the self-check) so the plan leads with value, not audit.
function Collapse({ summary, hint, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left hover:bg-slate-50"
      >
        <span className="text-sm font-medium text-ink">{summary}</span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-ink-faint">
          {hint && !open && <span className="hidden sm:inline">{hint}</span>}
          <span className={`inline-block transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </span>
      </button>
      {open && <div className="border-t border-slate-100 px-6 py-5">{children}</div>}
    </section>
  );
}

// The independent-contribution capstone, on a DERIVED horizon (observe→assist→own).
function ReadinessProject({
  firstTask,
  hasRealTask,
  deadline,
  timelineNote,
  modules = [],
  drafts = {},
  done = new Set(),
  projectTitle,
  gapCount = 0,
  embedded = false,
}) {
  const ft = firstTask || {};
  const phases = ft.phases || [];
  const allDone = modules.length > 0 && done.size >= modules.length;
  const draftStats = getDraftStats(modules, drafts);
  const fileNames = modules.map((m, i) => deliverableName(m, i));
  const markdown = buildProjectMarkdown(projectTitle, modules, fileNames, drafts, done);
  const projectHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`;
  const content = (
    <>
      {allDone && (
        <HandoffMemo
          drafted={draftStats.drafted}
          total={modules.length}
          files={draftStats.files}
          gapCount={gapCount}
          href={projectHref}
        />
      )}
      <p className="text-xs text-ink-soft">
        Readiness is staged — you go from watching the work to owning a piece of it. This is where the modules add up.
      </p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-medium text-ink">{ft.title}</span>
        {ft.horizon && (
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
            {ft.horizon}
          </span>
        )}
        {/* The UI owns the factual deadline — the model never restates or transforms it. */}
        {deadline && (
          <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink-soft">
            due {deadline}
          </span>
        )}
      </div>
      {ft.why && <p className="mt-1 text-sm text-ink-soft">{ft.why}</p>}
      {phases.length > 0 && (
        <ol className="mt-3 space-y-2">
          {phases.map((p, i) => (
            <li
              key={i}
              className="flex flex-col gap-0.5 rounded-lg bg-slate-50 px-3 py-2 sm:flex-row sm:items-baseline sm:gap-3"
            >
              <span className="flex shrink-0 items-baseline gap-1.5">
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                  {p.stage}
                </span>
                {p.timing && <span className="text-xs text-ink-faint">{p.timing}</span>}
              </span>
              <span className="min-w-0 text-sm text-ink">{p.goal}</span>
            </li>
          ))}
        </ol>
      )}
      {timelineNote && (
        <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs leading-relaxed text-ink-soft ring-1 ring-brand-100">
          <span className="font-medium text-ink">Pace:</span> {timelineNote}
        </p>
      )}
      {ft.horizonAssumed && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          We set this horizon as a default since you didn't give a timeline — go back and add a deadline or weekly pace
          to fit it to your real runway.
        </p>
      )}
      {!hasRealTask && (
        <p className="mt-3 text-xs text-ink-faint">
          Illustrative — a representative arc. With a real ticket from your team, the “Own” phase becomes your actual
          one.
        </p>
      )}
    </>
  );
  if (embedded) {
    return (
      <section className="rounded-xl border border-brand-200 bg-white px-5 py-5">
        <h2 className="text-base font-semibold text-ink">Your independent contribution</h2>
        <div className="mt-3">{content}</div>
      </section>
    );
  }
  return (
    <Card title="Your independent contribution" accent>
      {content}
    </Card>
  );
}

function HandoffMemo({ drafted, total, files, gapCount, href }) {
  const fileText = files.length ? files.join(" · ") : "no drafts yet";
  return (
    <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
      <p className="text-sm leading-relaxed text-ink">
        <span className="font-semibold">Handoff.</span> You arrive with {drafted} of {total} artifact
        {total === 1 ? "" : "s"} drafted — {fileText} — and {gapCount} gap{gapCount === 1 ? "" : "s"} closed.
        From here the arc is yours: Observe → Assist → Own.
      </p>
      <a
        href={href}
        download="labbridge-project.md"
        className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100"
      >
        Download my project — take your portfolio with you
      </a>
    </div>
  );
}

function cleanTopic(s) {
  return (s || "").split(" — ")[0];
}

function cleanPoint(s) {
  return cleanTopic(s).replace(/\s+—\s*$/, "").trim();
}

function shorten(s, max = 160) {
  const text = (s || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

function deliverableName(step, index) {
  const deliverable = step?.task?.deliverable || step?.task?.title || step?.topic || `task-${index + 1}`;
  const lower = deliverable.toLowerCase();
  const ext =
    lower.includes("table") || lower.includes("csv") || lower.includes("spreadsheet")
      ? ".csv"
      : lower.includes("summary") || lower.includes("memo") || lower.includes("brief")
        ? ".pdf"
        : lower.includes("code") || lower.includes("sql") || lower.includes("script")
          ? ".sql"
          : ".md";
  const base = cleanPoint(deliverable)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 42);
  return `${String(index + 1).padStart(2, "0")}_${base || "deliverable"}${ext}`;
}

function Finding({ tone, title, children }) {
  const bg = tone === "amber" ? "bg-amber-50" : "bg-slate-50";
  const tc = tone === "amber" ? "text-amber-800" : "text-ink-soft";
  return (
    <div className={`rounded-xl ${bg} px-4 py-3`}>
      <div className={`font-medium ${tc}`}>{title}</div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-ink">{children}</ul>
    </div>
  );
}

function Card({ title, subtitle, accent, emphasis, children }) {
  const shell =
    emphasis === "workspace"
      ? "border-slate-200 bg-white shadow-sm"
      : accent
        ? "border-brand-200 bg-brand-50/50"
        : "border-slate-200 bg-white";
  return (
    <section className={`rounded-2xl border p-5 sm:p-6 ${shell}`}>
      <h2 className={emphasis === "workspace" ? "text-base font-semibold text-ink" : "text-sm font-semibold text-ink"}>
        {title}
      </h2>
      {subtitle && (
        <p className={emphasis === "workspace" ? "mt-1 max-w-2xl text-sm text-ink-soft" : "mt-1 text-xs text-ink-soft"}>
          {subtitle}
        </p>
      )}
      <div className="mt-3">{children}</div>
    </section>
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
  const arts = form.headed.artifacts;
  // A link that couldn't be read (and wasn't pasted) told us NOTHING — it must
  // not steer the plan. Everything else contributes its real content.
  const usable = arts.filter((a) => {
    const content = (a.posting || a.text || "").trim();
    if (!content) return false;
    if (a.source === "link" && a.readStatus === "unreadable" && !a.posting) return false;
    return true;
  });
  const jobFields = arts.find((a) => a.jobFields && (a.jobFields.role || a.jobFields.company))?.jobFields || null;
  const unreadableLink = arts.some((a) => a.source === "link" && a.readStatus === "unreadable" && !a.posting);
  // A raw URL in the role box is not a role — don't pass it as one or count it as a target.
  const roleClean = looksLikeUrl(form.headed.role) ? "" : form.headed.role || "";
  const hasTarget = !!(roleClean.trim() || usable.length || (form.headed.realTask || "").trim());

  return {
    background: {
      field: form.background.field,
      sector: form.background.sector || [],
      skills: [...form.background.extractedSkills.map((s) => s.skill), ...form.background.skillsHave],
      // structured evidence for extracted skills, so strengths anchor to real phrases
      skillEvidence: form.background.extractedSkills
        .filter((s) => s.evidence)
        .map((s) => ({ skill: s.skill, evidence: s.evidence })),
      resume: form.background.resume,
      isBeginner,
    },
    target: {
      role: roleClean,
      artifacts: usable.map((a) => ({ type: a.type, text: (a.posting || a.text).slice(0, 8000) })),
      realTask: form.headed.realTask,
      instructions: form.headed.instructions,
      jobFields,
      unreadableLink,
      hasTarget,
    },
    goals: { depth: form.goals.depth, purpose: form.goals.purpose },
    timeline: {
      mode: form.timeline.mode,
      deadline: form.timeline.deadline,
      weeklyHrs: form.timeline.weeklyHrs,
    },
  };
}

// §2 of remaining-before-visual-spec: the coaching UX prototype. DEMO MODE ONLY —
// clearly labeled as canned, never rendered in the real flow (the fake-AI rule).
// Replies are templates over REAL state (draft length, unticked criteria), so even
// the canned version is honest about what it reads. This panel is the future
// /api/coach socket: when funded, real calls replace the template layer.
function SampleCoaching({ draft, criteria = [], checks, redFlags = [], concept = {}, task = {} }) {
  const [demo] = useState(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem("lb_mock") === "1";
    } catch {
      return false;
    }
  });
  const [exchange, setExchange] = useState(null); // { prompt, reply }
  if (!demo) return null;

  const words = (draft || "").trim() ? (draft || "").trim().split(/\s+/).length : 0;
  const firstUnticked = criteria.find((_, k) => !(checks?.has ? checks.has(`c${k}`) : false));

  const respond = (prompt) => {
    let reply;
    if (prompt === "Check my draft") {
      if (!words) reply = "Nothing here yet — write a first pass in Draft and I'll look.";
      else if (words < 30)
        reply = `It's a start, but thin (${words} words). Before I'd sign off: ${firstUnticked || "flesh out the deliverable per the task steps."}`;
      else
        reply = `Solid length (${words} words). Next thing I'd check: ${firstUnticked || "all criteria look covered — reread once against the red flags."}${
          redFlags[0] ? ` Watch for: ${redFlags[0]}` : ""
        }`;
    } else if (prompt === "Give me a hint") {
      reply = firstUnticked
        ? `Focus on this first: ${firstUnticked}`
        : `Everything's ticked — measure your draft against the definition of done: ${task.doneWhen || "the deliverable as stated."}`;
    } else {
      const terms = concept.keyTerms || [];
      reply = terms.length
        ? `In plain words: ${terms.map((t) => `${t.term} = ${t.plainMeaning}`).join("; ")}.`
        : (concept.explanation || "").split(". ")[0] + ".";
    }
    setExchange({ prompt, reply });
  };

  return (
    <div className="rounded-lg border border-brand-100 bg-brand-50/40 px-3 py-2.5">
      <p className="t-label text-brand-600">Sample coaching (demo)</p>
      <p className="mt-1 text-xs text-ink-faint">
        Canned responses to show how coaching will work — not AI.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {["Check my draft", "Give me a hint", "Explain simpler"].map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => respond(label)}
            className="rounded-md bg-white px-3 py-2 text-xs font-medium text-brand-700 ring-1 ring-brand-100 hover:ring-brand-300"
          >
            {label}
          </button>
        ))}
      </div>
      {exchange && (
        <div className="mt-3 space-y-2">
          <p className="ml-auto w-fit max-w-[85%] rounded-lg bg-brand-100 px-3 py-1.5 text-xs text-brand-800">
            {exchange.prompt}
          </p>
          <p className="w-fit max-w-[90%] rounded-lg bg-white px-3 py-2 text-xs leading-relaxed text-ink ring-1 ring-slate-100">
            {exchange.reply}
          </p>
        </div>
      )}
    </div>
  );
}


// The Roadmap (Sissi's confidence reframe of the briefing): the road starts
// BEHIND you (green "You today" from real strengths), shows every stop priced
// in hours with the file you'll walk away holding, and ends at the role. Every
// number derives from plan data — no invented percentages, no motivational
// filler. Trims shrink the visible road; regeneration stays honestly gated.
function timeboxHours(tb) {
  const t = (tb || "").toLowerCase();
  let m = t.match(/(\d+)\s*[-\u2013]\s*(\d+)\s*h/);
  if (m) return [Number(m[1]), Number(m[2])];
  m = t.match(/(\d+)\s*h/);
  if (m) return [Number(m[1]), Number(m[1])];
  if (/half a day/.test(t)) return [3, 4];
  m = t.match(/(\d+)\s*[-\u2013]?\s*(\d+)?\s*day/);
  if (m) return [Number(m[1]) * 6, Number(m[2] || m[1]) * 8];
  return null;
}

function totalHoursLabel(timeboxes) {
  let lo = 0, hi = 0;
  for (const tb of timeboxes) {
    const h = timeboxHours(tb);
    if (!h) return null; // one unparseable timebox → no hour math, stay honest
    lo += h[0]; hi += h[1];
  }
  if (!hi) return null;
  return lo === hi ? `~${hi} hrs` : `~${lo}\u2013${hi} hrs`;
}

function Roadmap({ plan, modules = [], done = new Set(), trims = [], onToggleTrim, roleName }) {
  const strengths = (plan.transferableStrengths || []).slice(0, 4).map((x) => cleanPoint(x.point));
  const ft = plan.firstTask || {};
  const stops = modules.map((m, i) => ({
    i,
    capability: m.topic,
    bridge: m.bridgeFromBackground,
    timebox: m.task?.timebox || "",
    file: deliverableName(m, i),
    isDone: done.has(i),
    isTrimmed: trims.includes(i) && !done.has(i),
  }));
  const remaining = stops.filter((x) => !x.isTrimmed && !x.isDone);
  const hours = totalHoursLabel(remaining.map((x) => x.timebox));
  const trimmedCount = stops.filter((x) => x.isTrimmed).length;

  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="t-label text-ink-faint">The whole road</p>
        <p className="text-xs font-medium text-ink-soft">
          {remaining.length} stop{remaining.length === 1 ? "" : "s"}
          {hours ? ` \u00b7 ${hours} of hands-on work` : ""}
          {ft.horizon ? ` \u00b7 ${ft.horizon}` : ""}
        </p>
      </div>

      <ol className="relative mt-4 ml-2 space-y-5 border-l-2 border-slate-200 pl-6">
        <li className="relative">
          <span className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
          <p className="text-sm font-semibold text-ink">You today</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {strengths.map((st, k) => (
              <span key={k} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
                ✓ {st}
              </span>
            ))}
          </div>
        </li>

        {stops.map((stop) => (
          <li key={stop.i} className={`relative ${stop.isTrimmed ? "opacity-50" : ""}`}>
            <span
              className={`absolute -left-[29px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold ${
                stop.isDone ? "bg-emerald-500 text-white" : "bg-white text-ink-faint ring-2 ring-slate-300"
              }`}
            >
              {stop.isDone ? "\u2713" : ""}
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <p className={`text-sm font-medium ${stop.isTrimmed ? "text-ink-faint line-through" : "text-ink"}`}>
                {stop.capability}
              </p>
              {stop.timebox && !stop.isDone && !stop.isTrimmed && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-ink-soft">{stop.timebox}</span>
              )}
              {stop.isDone && <span className="text-xs font-medium text-emerald-700">done</span>}
            </div>
            {stop.bridge && !stop.isTrimmed && (
              <p className="mt-0.5 text-xs italic text-ink-faint">↪ {stop.bridge}</p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="t-mono rounded bg-slate-50 px-1.5 py-0.5 text-xs text-ink-soft ring-1 ring-slate-100">
                {shorten(stop.file, 34)}
              </span>
              {!stop.isDone && (
                <button
                  type="button"
                  onClick={() => onToggleTrim(stop.i)}
                  aria-pressed={stop.isTrimmed}
                  className={`rounded-full px-2 py-0.5 text-xs transition ${
                    stop.isTrimmed
                      ? "bg-slate-100 font-medium text-ink"
                      : "text-ink-faint ring-1 ring-slate-200 hover:text-ink"
                  }`}
                >
                  {stop.isTrimmed ? "keep it after all" : "I already know this"}
                </button>
              )}
            </div>
          </li>
        ))}

        <li className="relative">
          <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[9px] text-white ring-4 ring-brand-100">
            ★
          </span>
          <p className="text-sm font-semibold text-ink">{roleName || "The role"}</p>
          {ft.title && <p className="mt-0.5 text-xs text-ink-soft">{ft.title}</p>}
        </li>
      </ol>

      {trimmedCount > 0 && (
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-ink-soft">
          {trimmedCount} stop{trimmedCount === 1 ? "" : "s"} marked as already known — saved. A leaner roadmap
          regenerates when the live model is connected; until then those stops stay available in your workspace.
        </p>
      )}
      <p className="mt-3 text-xs text-ink-faint">
        Nothing on this road assumes anything you don't already have — each stop is built from the one before it.
      </p>
    </section>
  );
}
