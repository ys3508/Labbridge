"use client";

import { useEffect, useState } from "react";
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

  // Progress persists locally so checkpoints survive a refresh (the continuity
  // a one-shot chatbot can't give). Cross-session/account memory is a later step.
  useEffect(() => {
    if (!plan) return;
    try {
      const raw = localStorage.getItem(planKey(plan.learningSequence));
      if (raw) setDone(new Set(JSON.parse(raw)));
    } catch {}
  }, [plan]);

  useEffect(() => {
    if (!plan?.learningSequence?.length) return;
    setActiveIndex((i) => Math.min(i, plan.learningSequence.length - 1));
  }, [plan]);

  const toggleDone = (i) => {
    setDone((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      try {
        localStorage.setItem(planKey(plan.learningSequence), JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const payload = buildPayload(form, isBeginner);

  // 1) Generate the plan.
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
  }, []);

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

  return (
    <div className="w-full fade-up space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-500">Your onboarding workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          {roleName ? `Toward ${roleName}${company ? ` at ${company}` : ""}` : "Where you're headed"}
        </h1>
        {roleName && fromLabel && (
          <p className="mt-1 text-sm text-ink-faint">
            {fromLabel} → {roleName}
          </p>
        )}
        <MissionBrief
          plan={plan}
          roleName={roleName}
          depthLabel={depthLabel}
          purposeLabel={purposeLabel}
          realTask={form.headed.realTask}
        />
      </header>

      {isBeginner && (
        <Note>
          We built this assuming you're <strong>starting fresh</strong> — tell us what you already know to trim it.
        </Note>
      )}

      {payload.target.unreadableLink && (
        <Note tone="warn">
          We couldn't read a job link you added — the site may block automated reading. This plan is built from your
          background and any other materials, <strong>not</strong> that posting. Paste the job description text in
          section 2 to target the exact role and company.
        </Note>
      )}

      {/* VALUE FIRST — the workspace is the center of gravity. */}
      <Card
        title="Your project workspace"
        subtitle="Everything you finish becomes part of your final project: the documents expected from a new analyst's first assignment."
      >
        <ProgressBar done={done.size} total={modules.length} label="tasks" />
        <div className="mt-4 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
            <ProjectFolder modules={modules} activeIndex={activeIndex} done={done} onSelect={setActiveIndex} />
            <MentorPanel activeModule={activeModule} />
          </aside>
          <div className="min-w-0">
            {activeModule && (
              <>
                <Module
                  i={activeIndex}
                  total={modules.length}
                  step={activeModule}
                  resources={topicResources[activeIndex]}
                  resourcesDone={resourcesDone}
                  isDone={done.has(activeIndex)}
                  onToggle={() => toggleDone(activeIndex)}
                  draft={drafts[activeIndex] || ""}
                  onDraftChange={(draft) => setDrafts((d) => ({ ...d, [activeIndex]: draft }))}
                />
                <TaskPager
                  activeIndex={activeIndex}
                  total={modules.length}
                  onPrev={() => setActiveIndex((i) => Math.max(0, i - 1))}
                  onNext={() => setActiveIndex((i) => Math.min(modules.length - 1, i + 1))}
                />
              </>
            )}
          </div>
        </div>
        {augmenting && (
          <p className="mt-3 text-xs text-ink-faint">Adding optional explanations to thin tasks…</p>
        )}
        <p className="mt-4 text-xs text-ink-faint">
          The project is the center. Learning appears only when it helps you complete the current deliverable.
        </p>
      </Card>

      {/* The capstone — the culmination of the course, on a DERIVED horizon. */}
      <ReadinessProject
        firstTask={plan.firstTask}
        hasRealTask={!!form.headed.realTask?.trim()}
        deadline={payload.timeline.mode === "deadline" ? (payload.timeline.deadline || "").trim() : ""}
      />

      {plan.timelineNote && (
        <p className="text-sm text-ink-soft">
          <span className="font-medium text-ink">Pace:</span> {plan.timelineNote}
        </p>
      )}

      {/* VERIFICATION, DEFERRED — the reasoning and self-check are available, not front-and-center. */}
      <Collapse
        summary={`The reasoning — built on ${plan.transferableStrengths?.length || 0} transferable strength${
          plan.transferableStrengths?.length === 1 ? "" : "s"
        }, targeting ${plan.knowledgeGaps?.length || 0} job-critical gap${
          plan.knowledgeGaps?.length === 1 ? "" : "s"
        }`}
        hint="why it picked these"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              What you already bring — and can skip
            </h3>
            <div className="mt-2">
              <PointList items={plan.transferableStrengths} />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">What's actually missing</h3>
            <div className="mt-2">
              <PointList items={plan.knowledgeGaps} />
            </div>
          </div>
        </div>
      </Collapse>

      <CheckReview check={check} checking={checking} />

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
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-faint">
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
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
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

function MissionBrief({ plan, roleName, depthLabel, purposeLabel, realTask }) {
  const strengths = (plan.transferableStrengths || []).slice(0, 3).map((s) => cleanPoint(s.point));
  const gaps = (plan.knowledgeGaps || []).slice(0, 3).map((g) => cleanPoint(g.point));
  const mission = realTask?.trim() || plan.firstTask?.title || (roleName ? `Complete your first ${roleName} assignment.` : "");
  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-base font-semibold text-ink">You're closer than you think.</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <BriefList title="Already strong" items={strengths} mark="✓" tone="emerald" />
        <BriefList title="Need to learn" items={gaps} mark="□" tone="slate" />
      </div>
      {mission && (
        <div className="mt-4 rounded-lg bg-brand-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">Mission</p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-ink">{shorten(mission, 180)}</p>
        </div>
      )}
      {(depthLabel || purposeLabel) && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {depthLabel && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-ink-soft">{depthLabel}</span>}
          {purposeLabel && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-ink-soft">{purposeLabel}</span>}
        </div>
      )}
    </section>
  );
}

function BriefList({ title, items, mark, tone }) {
  const markColor = tone === "emerald" ? "text-emerald-600" : "text-ink-faint";
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{title}</p>
      <ul className="mt-1.5 space-y-1">
        {(items.length ? items : ["Add more detail to sharpen this"]).map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-ink">
            <span className={markColor}>{mark}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectFolder({ modules, activeIndex, done, onSelect }) {
  const files = modules.map((m, i) => deliverableName(m, i));
  if (!files.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Project workspace</p>
          <p className="mt-0.5 text-sm text-ink-soft">Your first-assignment files.</p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] text-ink-faint ring-1 ring-slate-200">
          {files.length} files
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        {files.map((file, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs ring-1 transition ${
              activeIndex === i
                ? "bg-white text-ink ring-brand-200"
                : "bg-white/70 text-ink-soft ring-slate-100 hover:ring-brand-100"
            }`}
          >
            <span className={done.has(i) ? "text-emerald-600" : activeIndex === i ? "text-amber-500" : "text-ink-faint"}>
              {done.has(i) ? "✓" : activeIndex === i ? "●" : "○"}
            </span>
            <span className="min-w-0 flex-1 truncate">{file}</span>
            <span className="text-ink-faint">Open →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MentorPanel({ activeModule }) {
  const topic = activeModule?.task?.title || activeModule?.topic || "this task";
  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">AI mentor</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
        Paste a draft answer or ask why a step matters. LabBridge should coach the work, not just hand you a plan.
      </p>
      <button
        type="button"
        className="mt-3 w-full rounded-lg bg-white px-3 py-2 text-left text-xs font-medium text-brand-700 ring-1 ring-brand-100"
      >
        Ask about {shorten(topic, 42)}
      </button>
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

function TaskPager({ activeIndex, total, onPrev, onNext }) {
  if (total <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-between">
      <button
        type="button"
        onClick={onPrev}
        disabled={activeIndex === 0}
        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-ink-soft disabled:opacity-40"
      >
        Previous task
      </button>
      <span className="text-xs text-ink-faint">
        Task {activeIndex + 1} of {total}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={activeIndex === total - 1}
        className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
      >
        Next task
      </button>
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

function ProgressBar({ done, total, label = "modules" }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span>
          {done} of {total} {label} complete
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SubLabel({ children }) {
  return <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{children}</p>;
}

function ModulePanel({ label, children, tone = "plain" }) {
  const styles = {
    plain: "border-slate-200 bg-white",
    soft: "border-slate-100 bg-slate-50/70",
    action: "border-brand-300 bg-brand-50 ring-1 ring-brand-100",
  };
  return (
    <section className={`rounded-lg border px-4 py-3 ${styles[tone] || styles.plain}`}>
      <SubLabel>{label}</SubLabel>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

function Module({ i, total, step, resources, resourcesDone, isDone, onToggle, draft, onDraftChange }) {
  const t = step.task || {};
  const c = step.concept || {};
  const ex = step.workedExample || {};
  const sc = step.selfCheck || {};
  return (
    <section
      className={`rounded-xl border p-5 transition ${
        isDone ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={isDone ? "Mark not done" : "Mark done"}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${
            isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-ink-faint hover:border-brand-400"
          }`}
        >
          {isDone ? "✓" : i + 1}
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-brand-600">
            Task {i + 1}{total ? ` of ${total}` : ""}
          </div>
          <div className={`text-base font-semibold leading-snug ${isDone ? "text-ink-soft line-through" : "text-ink"}`}>
            {t.title || step.topic}
          </div>
          <div className="mt-1 text-sm leading-relaxed text-ink-soft">{step.why}</div>
          {step.bridgeFromBackground && (
            <p className="mt-2 rounded-md bg-brand-50 px-3 py-2 text-sm italic leading-relaxed text-brand-700">
              ↪ {step.bridgeFromBackground}
            </p>
          )}
          <QuickWin task={t} />

          <div className="mt-4 space-y-3">
            {/* TASK — the manager-assigned assignment. */}
            {t.title && (
              <ModulePanel label="Your assignment" tone="action">
              <div className="flex flex-wrap items-center gap-2">
                {t.timebox && <span className="text-[10px] text-ink-faint">⏱ {t.timebox}</span>}
              </div>
              {t.managerRequest && (
                <p className="mt-1.5 border-l-2 border-brand-300 pl-3 text-sm italic leading-relaxed text-ink-soft">
                  “{t.managerRequest}”
                </p>
              )}
              <WorkspacePanel step={step} moduleIndex={i} draft={draft} onDraftChange={onDraftChange} />
              {t.givenInputs?.length > 0 && (
                <div className="mt-1 text-xs leading-relaxed text-ink-soft">
                  <span className="font-medium">You're given:</span> {t.givenInputs.join(", ")}
                </div>
              )}
              {t.deliverable && (
                <div className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                  <span className="font-medium">Deliverable:</span> {t.deliverable}
                </div>
              )}
              {t.steps?.length > 0 && (
                <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-ink">
                  {t.steps.map((s, k) => (
                    <li key={k}>{s}</li>
                  ))}
                </ol>
              )}
              {t.doneWhen && (
                <div className="mt-3 flex items-baseline gap-1.5 rounded-md bg-white/60 px-2 py-1.5 text-xs leading-relaxed text-emerald-700">
                  <span>✓</span>
                  <span>
                    <span className="font-medium">Done when:</span> {t.doneWhen}
                  </span>
                </div>
              )}
              {t.stakeholders && (
                <div className="mt-2 flex items-baseline gap-1.5 text-xs leading-relaxed text-ink-soft">
                  <span>👥</span>
                  <span>
                    <span className="font-medium">Who consumes this:</span> {t.stakeholders}
                  </span>
                </div>
              )}
              </ModulePanel>
            )}

            {/* SELF-CHECK — how they know the work is good enough. */}
            {(sc.criteria?.length > 0 || sc.redFlags?.length > 0) && (
              <ModulePanel label="Check your work" tone="soft">
                <div className="grid gap-2 sm:grid-cols-2">
                  {sc.criteria?.length > 0 && (
                    <ul className="space-y-1">
                  {sc.criteria.map((cr, k) => (
                    <li key={k} className="flex items-baseline gap-1.5 text-xs leading-relaxed text-ink">
                      <span className="text-emerald-600">✓</span>
                      <span>{cr}</span>
                    </li>
                  ))}
                    </ul>
                  )}
                  {sc.redFlags?.length > 0 && (
                    <ul className="space-y-1">
                  {sc.redFlags.map((rf, k) => (
                    <li key={k} className="flex items-baseline gap-1.5 text-xs leading-relaxed text-ink-soft">
                      <span className="text-rose-500">⚠</span>
                      <span>{rf}</span>
                    </li>
                  ))}
                    </ul>
                  )}
                </div>
              </ModulePanel>
            )}
            {isDone && <DoneReward step={step} moduleIndex={i} />}

            <LearningLayer concept={c} example={ex} resources={resources} resourcesDone={resourcesDone} task={t} />
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickWin({ task }) {
  const [choice, setChoice] = useState(null);
  const anchor = task.givenInputs?.[0] || "the file your manager handed you";
  const options = [
    { key: "given", label: anchor, correct: true },
    { key: "outside", label: "A random outside article", correct: false },
    { key: "final", label: "The final summary", correct: false },
  ];
  const selected = options.find((o) => o.key === choice);
  return (
    <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Before you start</p>
      <p className="mt-1 text-sm text-ink">What should anchor your first pass?</p>
      <div className="mt-2 grid gap-1.5">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setChoice(o.key)}
            className={`rounded-md border px-3 py-2 text-left text-xs transition ${
              choice === o.key
                ? o.correct
                  ? "border-emerald-300 bg-white text-emerald-800"
                  : "border-amber-300 bg-white text-amber-800"
                : "border-transparent bg-white/60 text-ink-soft hover:border-emerald-200 hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {selected && (
        <p className={`mt-2 text-xs ${selected.correct ? "text-emerald-700" : "text-amber-800"}`}>
          {selected.correct
            ? "Correct. Start from the material you were handed — that's how this becomes work, not homework."
            : "Close, but start with the material you were handed. Outside reading only helps after you know the task."}
        </p>
      )}
    </div>
  );
}

function LearningLayer({ concept, example, resources, resourcesDone, task }) {
  const [page, setPage] = useState("mental");
  const pages = [
    { key: "mental", label: "Mental model" },
    { key: "example", label: "Example" },
    { key: "mentor", label: "AI mentor" },
    { key: "refs", label: "Extra help" },
  ];
  return (
    <details className="group rounded-lg border border-slate-200 bg-white px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs text-ink-soft">
        <span>
          <span className="font-semibold uppercase tracking-wide text-ink-faint">Stuck?</span>
          <span className="ml-2 text-ink-faint">Open the learning layer for this task</span>
        </span>
        <span className="text-ink-faint transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="mt-3 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap gap-1.5">
          {pages.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setPage(p.key);
              }}
              className={`rounded-full px-2.5 py-1 text-xs transition ${
                page === p.key ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-ink-soft hover:bg-brand-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-3">
          {page === "mental" && (
            <ModulePanel label="Mental model" tone="soft">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                {shorten(concept.explanation, 420)}
              </p>
              {concept.keyTerms?.length > 0 && (
                <dl className="mt-3 border-t border-slate-100 pt-2">
                  {concept.keyTerms.map((k, j) => (
                    <div key={j} className="py-0.5 text-xs">
                      <dt className="inline font-semibold text-ink">{k.term}</dt>
                      <dd className="inline text-ink-soft"> — {k.plainMeaning}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {concept.misconceptionToAvoid && (
                <p className="mt-3 rounded-md border-l-2 border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                  <span className="font-medium">Common mistake:</span> {concept.misconceptionToAvoid}
                </p>
              )}
            </ModulePanel>
          )}

          {page === "example" && (
            <ModulePanel label="Tiny example" tone="soft">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{example.setup}</p>
              {example.walkThrough?.length > 0 && (
                <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-ink-soft">
                  {example.walkThrough.map((s, k) => (
                    <li key={k}>{s}</li>
                  ))}
                </ol>
              )}
              {example.takeaway && (
                <p className="mt-3 border-t border-slate-200/70 pt-2 text-xs leading-relaxed text-ink-soft">
                  <span className="font-medium text-ink">Takeaway:</span> {example.takeaway}
                </p>
              )}
            </ModulePanel>
          )}

          {page === "mentor" && (
            <ModulePanel label="Ask LabBridge" tone="soft">
              <p className="text-sm leading-relaxed text-ink-soft">
                Paste a sentence from your draft and ask for critique. A real AI mentor pass will check whether your
                answer is specific enough for this deliverable.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {["Explain simpler", "Check my answer", "Give me a hint"].map((label) => (
                  <button key={label} type="button" className="rounded-md bg-white px-3 py-2 text-xs text-brand-700 ring-1 ring-brand-100">
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink-faint">Current task: {task.title}</p>
            </ModulePanel>
          )}

          {page === "refs" && <NodeResources resources={resources} done={resourcesDone} />}
        </div>
      </div>
    </details>
  );
}

function WorkspacePanel({ step, moduleIndex, draft, onDraftChange }) {
  const file = deliverableName(step, moduleIndex);
  const checklist = [
    "Notes",
    "Draft",
    "Checklist",
    "Deliverable",
  ];
  return (
    <div className="mt-2 rounded-lg border border-brand-100 bg-white/70 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">Your deliverable</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">{file}</p>
        </div>
        <button
          type="button"
          className="rounded-full bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700"
        >
          Open →
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {checklist.map((item, i) => (
          <div key={item} className="rounded-md bg-slate-50 px-2 py-1.5 text-xs text-ink-soft">
            <span className={i === 0 ? "text-emerald-600" : "text-ink-faint"}>{i === 0 ? "✓" : "□"}</span>{" "}
            {item}
          </div>
        ))}
      </div>
      <label className="mt-3 block">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Draft notes</span>
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          rows={3}
          placeholder="Start writing the artifact here. What did you notice first?"
          className="mt-1 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-ink focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-200"
        />
      </label>
    </div>
  );
}

function DoneReward({ step, moduleIndex }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
      <p className="text-sm font-semibold text-emerald-800">Great work. Artifact added to your project.</p>
      <p className="mt-1 text-xs leading-relaxed text-emerald-700">
        Your RWE lead can now review <span className="font-medium">{deliverableName(step, moduleIndex)}</span>. You are
        building the project, not just checking off a lesson.
      </p>
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

// A lightweight, default-collapsed drawer — used for verification surfaces
// (the reasoning, the self-check) so the plan leads with value, not audit.
function Collapse({ summary, hint, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
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
function ReadinessProject({ firstTask, hasRealTask, deadline }) {
  const ft = firstTask || {};
  const phases = ft.phases || [];
  return (
    <Card title="Your independent contribution" accent>
      <p className="text-xs text-ink-soft">
        Readiness is staged — you go from watching the work to owning a piece of it. This is where the modules add up.
      </p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-medium text-ink">{ft.title}</span>
        {ft.horizon && (
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
            {ft.horizon}
          </span>
        )}
        {/* The UI owns the factual deadline — the model never restates or transforms it. */}
        {deadline && (
          <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink-soft">
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
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-200">
                  {p.stage}
                </span>
                {p.timing && <span className="text-[11px] text-ink-faint">{p.timing}</span>}
              </span>
              <span className="text-sm text-ink">{p.goal}</span>
            </li>
          ))}
        </ol>
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
    </Card>
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
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-ink">{children}</ul>
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
