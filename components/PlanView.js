"use client";

import { useEffect, useRef, useState } from "react";
import { Note } from "./ui";
import VoiceInput from "./VoiceInput";
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
  // Focus mode (Sissi: 沉浸式学习 — the workspace goes quiet while you work).
  // Automatic: inside a task's moments everything non-essential collapses;
  // Wrap and the folder restore the full workspace. zen=false = user opted out.
  const [zen, setZen] = useState(true);
  // Toolbox notes: thinking space, separate from the Draft (the deliverable).
  const [notes, setNotes] = useState({});
  const [openTool, setOpenTool] = useState(null);
  useEffect(() => {
    if (!plan?.learningSequence) return;
    try {
      const raw = localStorage.getItem(scopedPlanKey("lb_notes", plan.learningSequence));
      if (raw) setNotes(JSON.parse(raw));
    } catch {}
  }, [plan]);
  const setTaskNotes = (i, text) =>
    setNotes((prev) => {
      const next = { ...prev, [i]: text };
      try {
        localStorage.setItem(scopedPlanKey("lb_notes", plan.learningSequence), JSON.stringify(next));
      } catch {}
      return next;
    });
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

  // Split-pane AI assistant (Sissi): read on the left, ask on the right.
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantSeed, setAssistantSeed] = useState("");

  // World canon seeding (borrowed from the Phase-A draft): when the PLAN itself
  // ships an entitySheet, it becomes the canon at birth — examples and materials
  // derive from one world from the first page.
  useEffect(() => {
    if (!plan?.entitySheet) return;
    try {
      const k = canonKey(plan);
      if (!localStorage.getItem(k)) localStorage.setItem(k, plan.entitySheet);
    } catch {}
  }, [plan]);

  // Time tracker (Sissi's mechanic 2): count ACTIVE seconds only — tab visible,
  // a task open, input within the last 2 minutes. The timeline makes a promise;
  // this shows it being kept. A signal, never surveillance.
  const [timeSpent, setTimeSpent] = useState({});
  const lastInputRef = useRef(Date.now());
  useEffect(() => {
    if (!stateLoaded || !plan?.learningSequence?.length) return;
    try {
      setTimeSpent(JSON.parse(localStorage.getItem(scopedPlanKey("lb_time", plan.learningSequence)) || "{}"));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateLoaded, plan]);
  useEffect(() => {
    const mark = () => {
      lastInputRef.current = Date.now();
    };
    window.addEventListener("pointerdown", mark);
    window.addEventListener("keydown", mark);
    window.addEventListener("scroll", mark, true);
    return () => {
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("keydown", mark);
      window.removeEventListener("scroll", mark, true);
    };
  }, []);
  useEffect(() => {
    if (!plan?.learningSequence?.length) return;
    const iv = setInterval(() => {
      if (document.hidden) return;
      if (activeSurface !== "task") return;
      if (Date.now() - lastInputRef.current > 120000) return;
      setTimeSpent((prev) => {
        const next = { ...prev, [activeIndex]: (prev[activeIndex] || 0) + 5 };
        try {
          localStorage.setItem(scopedPlanKey("lb_time", plan.learningSequence), JSON.stringify(next));
        } catch {}
        return next;
      });
    }, 5000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, activeSurface, activeIndex]);

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

  // Generation cache: a paid plan is reusable. Same inputs → load from
  // localStorage instead of re-billing an Opus call on every refresh. Retry
  // bypasses and overwrites. Demo mode bypasses entirely (personas share an
  // empty form, so a shared hash would freeze persona switching).
  const genKey = () => {
    const str = JSON.stringify(payload);
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return "lb_gen_" + (h >>> 0).toString(36);
  };
  const isDemo = () => {
    try {
      return typeof window !== "undefined" && localStorage.getItem("lb_mock") === "1";
    } catch {
      return false;
    }
  };
  const restoredRef = useRef(false);
  const saveGenCache = (patch) => {
    if (isDemo()) return;
    try {
      const k = genKey();
      const cur = JSON.parse(localStorage.getItem(k) || "{}");
      localStorage.setItem(k, JSON.stringify({ ...cur, ...patch, savedAt: Date.now() }));
    } catch {}
  };

  // 1) Generate the plan. `attempt` lets the error state offer an honest Retry
  //    (a paid call each time — user-initiated only, never automatic).
  const [attempt, setAttempt] = useState(0);
  // Spend gate: the cache key hashes the full payload — including AI-extracted
  // skill chips, which can word themselves differently between sessions. So the
  // same person re-entering the same materials can MISS their exact key and
  // silently re-bill a full generation. If any saved plan exists, offer it
  // BEFORE spending; "generate new" stays one honest click away.
  const [pendingRestore, setPendingRestore] = useState(null); // array of { key, cached }, newest first
  const savedPlans = () => {
    try {
      const found = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith("lb_gen_")) continue;
        const v = JSON.parse(localStorage.getItem(k) || "null");
        if (v?.plan) found.push({ key: k, cached: v });
      }
      return found.sort((a, b) => (b.cached.savedAt || 0) - (a.cached.savedAt || 0));
    } catch {
      return [];
    }
  };
  const adoptCached = (cached) => {
    try {
      localStorage.removeItem("lb_gen_inflight");
    } catch {}
    restoredRef.current = true;
    setPlan(cached.plan);
    if (cached.resources) {
      setTopicResources(cached.resources);
      setResourcesDone(true);
    }
    if (cached.check) setCheck(cached.check);
  };
  useEffect(() => {
    let alive = true;
    setError(null);
    if (attempt === 0 && !isDemo()) {
      try {
        const cached = JSON.parse(localStorage.getItem(genKey()) || "null");
        if (cached?.plan) {
          adoptCached(cached);
          return;
        }
      } catch {}
      const saved = savedPlans();
      // #64: a refresh DURING generation used to silently re-fire a full paid
      // call (the cache only saves on completion). A fresh in-flight marker now
      // routes to the gate instead — regenerating is always an explicit click.
      let interrupted = false;
      try {
        interrupted = Date.now() - Number(localStorage.getItem("lb_gen_inflight") || 0) < 10 * 60 * 1000;
      } catch {}
      if (saved.length || interrupted) {
        setPendingRestore(saved);
        return; // no spend until the user chooses
      }
    }
    setPendingRestore(null);
    restoredRef.current = false;
    try {
      localStorage.setItem("lb_gen_inflight", String(Date.now()));
    } catch {}
    post("/api/plan", payload).then((d) => {
      try {
        localStorage.removeItem("lb_gen_inflight");
      } catch {}
      if (!alive) return;
      if (d?.plan) {
        setPlan(d.plan);
        saveGenCache({ plan: d.plan });
      } else setError(d?.error || "Plan generation failed.");
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
    if (restoredRef.current) return; // resources came from the cache
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
        saveGenCache({ resources: byIndex });
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
    if (restoredRef.current) {
      setChecking(false);
      return;
    }
    post("/api/check", { plan, background: payload.background, timeline: payload.timeline })
      .then((d) => {
        if (alive && d && !d.error) {
          setCheck(d);
          saveGenCache({ check: d });
        }
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

  if (!plan && pendingRestore) {
    return (
      <div className="mx-auto max-w-lg py-16 fade-up">
        <div className="rounded-xl border border-brand-100 bg-white px-5 py-4">
          <p className="t-label text-brand-600">
            {pendingRestore.length === 0
              ? "A generation was already in progress"
              : pendingRestore.length === 1
                ? "You have a saved plan"
                : `You have ${pendingRestore.length} saved plans`}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            {pendingRestore.length === 0
              ? "It looks like a plan was still being generated when this page reloaded. That call may have completed and been lost — generating again is a new paid call, so it stays your choice."
              : "Plans you already generated are saved in this browser. Loading one is free and keeps its progress; generating fresh is a paid call."}
          </p>
          <ul className="mt-3 space-y-2">
            {pendingRestore.map((s) => {
              const when = s.cached.savedAt ? new Date(s.cached.savedAt).toLocaleString() : "";
              const label =
                s.cached.plan?.readinessTitle || s.cached.plan?.hook || "Generated plan";
              const stops = s.cached.plan?.learningSequence?.length;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => {
                      adoptCached(s.cached);
                      setPendingRestore(null);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left hover:border-brand-300"
                  >
                    <span className="block text-sm font-medium text-ink">“{shorten(String(label), 80)}”</span>
                    <span className="mt-0.5 block text-xs text-ink-faint">
                      {when}
                      {stops ? ` · ${stops} task${stops === 1 ? "" : "s"}` : ""} · load free
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setAttempt((a) => a + 1)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink-soft hover:border-brand-300 hover:text-ink"
            >
              Generate a new plan from my current inputs (paid)
            </button>
          </div>
        </div>
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
  const purpose = form.goals.purpose;
  const activeModule = modules[activeIndex] || modules[0];
  const activeMeta = activeModule ? getMomentMeta(activeModule, purpose) : [];
  const activeMomentKey = activeMeta.length
    ? activeMeta[Math.min(Number(momentsByTask[activeIndex] || 0), activeMeta.length - 1)]?.key
    : null;
  const focused = zen && activeSurface === "task" && !!activeModule && activeMomentKey !== "reward";
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
    // Earned-state only: moving on is always allowed, but the done-ledger (sidebar
    // ✓, briefing gap chips) records a task only when its draft actually exists.
    if ((drafts[i] || "").trim()) markDone(i);
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
          {plan.hook && (
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-soft">{firstSentence(plan.hook)}</p>
          )}
          <Roadmap plan={plan} modules={modules} done={done} trims={trims} onToggleTrim={toggleTrim} roleName={roleName} purpose={purpose} deadline={payload.timeline.mode === "deadline" ? (payload.timeline.deadline || "").trim() : ""} />
        </header>

        <div className="mt-6 space-y-3">
          {isBeginner && (
            <Note>
              We built this assuming you're <strong>starting fresh</strong> — mark any stop below “I already know this” to trim the road.
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
    <div className={`w-full fade-up lg:flex lg:h-[calc(100dvh-7rem)] lg:min-h-0 lg:flex-col ${assistantOpen ? "lg:mr-[404px]" : ""}`}>
      <section className={`lg:flex lg:min-h-0 lg:flex-1 lg:flex-col ${focused ? "" : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"}`}>
        <header className={`lg:shrink-0 ${focused ? "px-1 pb-2" : "border-b border-brand-100 px-4 py-4 sm:px-6"}`}>
          {focused ? (
            <div className="flex items-center justify-between gap-3 py-0.5">
              <button
                type="button"
                onClick={() => setZen(false)}
                className="rounded-full px-2.5 py-1 text-xs font-medium text-ink-soft ring-1 ring-slate-200 hover:text-ink"
              >
                ☰ Workspace
              </button>
              <p className="min-w-0 truncate text-sm font-medium text-ink">{activeModule?.task?.title || activeModule?.topic}</p>
              <p className="shrink-0 text-xs text-ink-faint">
                <TimeMeter modules={modules} timeSpent={timeSpent} deadline={deadline} inline /> · Task{" "}
                {activeIndex + 1}/{modules.length}
              </p>
            </div>
          ) : (
            <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="t-label text-brand-600">Workspace home</p>
              <h1 className="mt-1 text-lg font-semibold leading-tight text-ink">{planTitle}</h1>
              <p className="mt-1 max-w-3xl truncate text-sm text-ink-soft">{missionLine}</p>
            </div>
            <div className="shrink-0 space-y-2 lg:w-64">
              <ProgressBar modules={modules} done={done} momentsByTask={momentsByTask} drafts={drafts} compact purpose={purpose} />
              <TimeMeter modules={modules} timeSpent={timeSpent} deadline={deadline} />
              <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={() => setZen(true)}
                  title="Focus — hide everything but the work"
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink-soft ring-1 ring-slate-200 hover:text-ink"
                >
                  ⛶ Focus
                </button>
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
          {purpose === "interview" && !focused && (
            <QuestionMap
              modules={modules}
              done={done}
              trims={trims}
              activeIndex={activeIndex}
              onOpen={openTask}
              onToggleTrim={toggleTrim}
            />
          )}
        </>
          )}
        </header>

        <div className={`grid gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden ${focused ? "p-0 lg:grid-cols-[minmax(0,1fr)]" : "p-4 lg:p-6 lg:grid-cols-[280px_minmax(0,1fr)]"}`}>
          {!focused && (
          <aside className="min-w-0 space-y-3 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            <ProjectFolder
              notes={notes}
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
          )}
          <div ref={taskPanelRef} className={`min-w-0 scroll-mt-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1 ${focused ? "lg:mx-auto lg:w-full lg:max-w-4xl" : ""}`}>
            {activeSurface === "capstone" ? (
              <ReadinessProject
                notes={notes}
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
                  focus={focused}
                  momentIndex={momentsByTask[activeIndex] || 0}
                  onMomentChange={(momentIndex) => {
                    setWelcomeBack(null);
                    setTaskMoment(activeIndex, momentIndex);
                  }}
                  checks={checksByTask[activeIndex] || []}
                  onToggleCheck={(key) => toggleTaskCheck(activeIndex, key)}
                  prevDraft={activeIndex > 0 ? drafts[activeIndex - 1] || "" : null}
                  allDrafts={drafts}
                  purpose={purpose}
                  onDiscuss={(seed) => {
                    setAssistantSeed(seed);
                    setAssistantOpen(true);
                  }}
                  prevArtifact={activeIndex > 0 ? deliverableName(modules[activeIndex - 1], activeIndex - 1) : ""}
                />
              )
            )}
            {augmenting && (
              <p className="mt-3 text-xs text-ink-faint">Adding optional explanations to thin tasks…</p>
            )}
          </div>
        </div>
      </section>

      {assistantOpen && activeModule && (
        <AssistantPanel
          seed={assistantSeed}
          onSeedConsumed={() => setAssistantSeed("")}
          onClose={() => setAssistantOpen(false)}
          module={activeModule}
          moduleIndex={activeIndex}
          beatKey={activeMomentKey}
          plan={plan}
          draft={drafts[activeIndex] || ""}
          purpose={purpose}
        />
      )}
      <Toolbox
        assistantOpen={assistantOpen}
        onAssistant={() => setAssistantOpen((v) => !v)}
        modules={modules}
        activeIndex={activeIndex}
        activeModule={activeModule}
        activeMomentKey={activeMomentKey}
        notes={notes}
        onNotes={setTaskNotes}
        drafts={drafts}
        checksByTask={checksByTask}
        openTool={openTool}
        setOpenTool={setOpenTool}
      />

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
    return null; // review #77: announcing an absence nobody asked about was dead space
  }
  return (
    <details className="group rounded-lg border border-slate-100 bg-white px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs text-ink-soft">
        <span className="min-w-0">
          <span className="font-semibold uppercase tracking-wide text-ink-faint">Need another explanation?</span>
          {/* #86: name the verified source up front — a hidden count reads as a
              hallucination risk; the actual titles are catalog-verified. */}
          <span className="ml-2 text-ink-faint">
            {shorten(resources[0]?.title || "", 60)}
            {resources.length > 1 ? ` + ${resources.length - 1} more` : ""} · verified
          </span>
        </span>
        <span className="text-ink-faint transition-transform group-open:rotate-180">▾</span>
      </summary>
      <ul className="mt-3 space-y-3 border-t border-slate-100 pt-3">
        {resources.map((r, k) => (
          <li key={k} className="text-sm">
            {r.kind === "video" && youtubeId(r.url) && (
              <div className="mb-2 overflow-hidden rounded-lg border border-slate-200">
                <iframe
                  className="aspect-video w-full"
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId(r.url)}`}
                  title={r.title}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            )}
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
            {r.keyPoint && (
              <blockquote className="mt-2 border-l-2 border-slate-200 pl-2 text-xs leading-relaxed text-ink-soft">
                “{r.keyPoint}”
                <span className="ml-1 text-ink-faint">— from the abstract</span>
              </blockquote>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

function ProjectFolder({
  notes = {},
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

  const projectMarkdown = buildProjectMarkdown(projectTitle, modules, files, drafts, done, notes);
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

// Purpose picks the grammar (Sissi's flexibility redesign): the same beats wear
// different identities per career goal, and "curious" drops the homework beats
// entirely. Defaults = starting_role, the original job simulation.
const BEAT_IDENTITY = {
  starting_role: {
    brief: ["Brief", "Why am I here?"], model: ["Model", "What's the idea?"],
    visual: ["Example", "What does it look like?"], question: ["Check", "Did it land?"],
    practice: ["Try", "Can I do it myself?"], artifact: ["Draft", "What did I produce?"],
    coach: ["Coach", "Am I right?"], reward: ["Wrap", "What changed in my project?"],
  },
  interview: {
    // Fork 6 (drill grammar): no `model` beat — a strong answer shown before they
    // speak is the fantasy answer parent §6 forbids, and it contaminates. No
    // `visual` "hear it" beat either — there is no TTS and nothing to hear. Both
    // keys are absent so the beats can never render (getMomentMeta / buildMoments
    // gate on the label existing); the decode line teaches, dig supplies material.
    brief: ["Question", "Why do they ask this?"],
    question: ["Rapid fire", "Can I answer cold?"],
    practice: ["Rehearse", "Can I say it in my words?"], artifact: ["Bank it", "What's MY answer?"],
    coach: ["Score", "Would this land?"], reward: ["Banked", "What's in my answer bank?"],
  },
  career_move: {
    brief: ["Stop", "What is this corner of the field?"], model: ["Reality", "What's the durable idea?"],
    visual: ["A day in it", "What does the work look like?"], question: ["Gut check", "Does this fit me?"],
    practice: ["Taste", "Do I enjoy doing it?"], artifact: ["Evidence", "What did I learn about fit?"],
    coach: ["Weigh it", "What does the evidence say?"], reward: ["Ledger", "Where does my decision stand?"],
  },
  curious: {
    brief: ["Hook", "Why is this interesting?"], model: ["Big idea", "What's the one idea?"],
    visual: ["See it", "Show me."], question: ["Huh?", "Did that land?"],
    practice: ["Tiny try", "Want to poke at it?"], artifact: ["Scratch", "Want to jot something?"],
    coach: ["Hmm", "Was I right?"], reward: ["Door", "Where does this lead?"],
  },
};
function beatIdentity(purpose) {
  return BEAT_IDENTITY[purpose] || BEAT_IDENTITY.starting_role;
}

function getMomentMeta(step, purpose) {
  const id = beatIdentity(purpose);
  const task = step?.task || {};
  const concept = step?.concept || {};
  const example = step?.workedExample || {};
  const curious = purpose === "curious";
  const moments = [{ key: "brief", label: id.brief[0], objective: id.brief[1] }];
  if (concept.explanation && id.model) moments.push({ key: "model", label: id.model[0], objective: id.model[1] });
  if (example.setup && id.visual) moments.push({ key: "visual", label: id.visual[0], objective: id.visual[1] });
  if (step?.comprehensionCheck?.question) {
    moments.push({ key: "question", label: id.question[0], objective: id.question[1] });
  }
  if (task.steps?.length) moments.push({ key: "practice", label: id.practice[0], objective: id.practice[1] });
  // Review reshuffle: you write BEFORE you're reviewed. Draft precedes Coach so
  // the self-check + AI review react to a draft that exists.
  // Curious drops the homework beats: no draft/coach unless a real task exists.
  if (!curious || task.steps?.length) {
    moments.push({ key: "artifact", label: id.artifact[0], objective: id.artifact[1] });
    if (!curious) moments.push({ key: "coach", label: id.coach[0], objective: id.coach[1] });
  }
  moments.push({ key: "reward", label: id.reward[0], objective: id.reward[1] });
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

function buildProjectMarkdown(projectTitle, modules, files, drafts, done, notes = {}) {
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
    const note = (notes[i] || "").trim();
    if (note) lines.push("### Notes", "", note, "");
  });
  return lines.join("\n");
}

function ProgressBar({ modules = [], done = new Set(), momentsByTask = {}, drafts = {}, compact = false, purpose }) {
  const total = modules.length;
  const doneCount = done.size;
  const noun = purpose === "interview" ? "answer" : "project file";
  /* a11y: expose the earned count to assistive tech. */
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={doneCount} aria-label={`${doneCount} of ${total} ${noun}${total === 1 ? "" : "s"} ${purpose === "interview" ? "banked" : "built"}`}>
      <div className="text-xs text-ink-soft">
        {total > 0 && doneCount >= total ? (
          <span>
            All {total} {noun}{total === 1 ? "" : "s"} {purpose === "interview" ? "banked" : "built"} — your {purpose === "interview" ? "mock interview" : "readiness project"} is open ★
          </span>
        ) : (
          <span>
            {doneCount} of {total} {noun}{total === 1 ? "" : "s"} {purpose === "interview" ? "banked" : "built"}
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

const QUESTION_SECTIONS = {
  fit: "Fit",
  track_record: "Track record",
  capability: "Capability",
  judgment: "Judgment",
};
const QUESTION_TAGS = {
  start_here: { label: "start here", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  you_named_this: { label: "you named this", cls: "bg-brand-50 text-brand-700 ring-brand-200" },
  blind_spot: { label: "blind spot", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
};
const TAG_PRIORITY = { you_named_this: 0, blind_spot: 1, start_here: 2 };
const SECTION_PRIORITY = { fit: 0, track_record: 1, capability: 2, judgment: 3 };

function questionSection(module) {
  return QUESTION_SECTIONS[module?.section] ? module.section : "capability";
}

function questionTag(module) {
  return QUESTION_TAGS[module?.tag] ? module.tag : "";
}

function questionReceipt(module) {
  return (module?.why || "").trim();
}

function isQuestionSkippable(module) {
  const tag = questionTag(module);
  return tag !== "you_named_this" && tag !== "blind_spot";
}

function orderQuestionItems(items, orderMode) {
  const sorted = [...items];
  if (orderMode === "room") return sorted.sort((a, b) => a.index - b.index);
  return sorted.sort((a, b) => {
    const tagDelta = (TAG_PRIORITY[questionTag(a.module)] ?? 4) - (TAG_PRIORITY[questionTag(b.module)] ?? 4);
    if (tagDelta) return tagDelta;
    const sectionDelta = (SECTION_PRIORITY[questionSection(a.module)] ?? 9) - (SECTION_PRIORITY[questionSection(b.module)] ?? 9);
    if (sectionDelta) return sectionDelta;
    return a.index - b.index;
  });
}

function groupedQuestionItems(modules, orderMode) {
  const items = orderQuestionItems(
    modules.map((module, index) => ({ module, index })),
    orderMode
  );
  return items.reduce((groups, item) => {
    const section = questionSection(item.module);
    if (!groups.find((g) => g.section === section)) groups.push({ section, items: [] });
    groups.find((g) => g.section === section).items.push(item);
    return groups;
  }, []);
}

function QuestionTag({ tag }) {
  const meta = QUESTION_TAGS[tag];
  if (!meta) return null;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function QuestionMap({ modules = [], done = new Set(), trims = [], activeIndex, onOpen, onToggleTrim }) {
  const [orderMode, setOrderMode] = useState("worry");
  if (!modules.length) return null;
  const groups = groupedQuestionItems(modules, orderMode);
  const askQuestions = modules.flatMap((m) => m.askYourTeam || []).filter(Boolean).slice(0, 8);

  return (
    <section className="mt-4 rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="t-label text-brand-700">Question Map</p>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-ink-soft">
            The questions this round is likely to ask. Not a guarantee — but nothing here is guessed; each one traces to something real.
          </p>
        </div>
        <div className="flex shrink-0 rounded-full bg-white p-0.5 text-xs ring-1 ring-brand-100">
          {[
            ["worry", "Prep order"],
            ["room", "Interview order"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setOrderMode(key)}
              className={`rounded-full px-3 py-1 font-medium transition ${
                orderMode === key ? "bg-brand-600 text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {groups.map((group) => (
          <div key={group.section} className="rounded-lg bg-white px-3 py-2 ring-1 ring-brand-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{QUESTION_SECTIONS[group.section]}</p>
            <div className="mt-2 space-y-2">
              {group.items.map(({ module, index }) => {
                const tag = questionTag(module);
                const receipt = questionReceipt(module);
                const skipped = trims.includes(index) && !done.has(index);
                const skippable = isQuestionSkippable(module);
                return (
                  <div
                    key={index}
                    className={`rounded-md border px-3 py-2 text-left transition ${
                      activeIndex === index
                        ? "border-brand-200 bg-brand-50/60"
                        : skipped
                          ? "border-slate-100 bg-slate-50 opacity-60"
                          : "border-slate-100 bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onOpen(index)}
                        className="min-w-0 flex-1 text-left text-sm font-medium leading-snug text-ink hover:text-brand-700"
                      >
                        {module.task?.managerRequest || module.topic || `Question ${index + 1}`}
                      </button>
                      <div className="flex shrink-0 flex-wrap gap-1">
                        <QuestionTag tag={tag} />
                        {done.has(index) && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            banked
                          </span>
                        )}
                      </div>
                    </div>
                    {receipt && <p className="mt-1 text-xs italic leading-relaxed text-ink-faint">receipt: “{shorten(receipt, 120)}”</p>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => onOpen(index)} className="text-xs font-semibold text-brand-700 hover:underline">
                        Rehearse →
                      </button>
                      {!done.has(index) && (
                        skippable ? (
                          <button
                            type="button"
                            onClick={() => onToggleTrim(index)}
                            className="text-xs text-ink-faint underline decoration-slate-300 underline-offset-2 hover:text-ink"
                          >
                            {skipped ? "Put back in prep" : "You don't need to practice this — but you will be asked. Skip?"}
                          </button>
                        ) : (
                          <span className="text-xs text-ink-faint">Not skippable — this is why the map exists.</span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {askQuestions.length > 0 && (
        <div className="mt-3 rounded-lg bg-white px-3 py-2 ring-1 ring-brand-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Questions to ask them</p>
          <ul className="mt-2 grid gap-1.5 text-xs leading-relaxed text-ink-soft sm:grid-cols-2">
            {askQuestions.map((q, i) => (
              <li key={i}>• {q}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
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
  // `focus` was missing here — JSX below silently resolved it to window.focus
  // (always truthy), so the moment dots were hidden even outside focus mode.
  focus,
  prevDraft,
  prevArtifact,
  allDrafts,
  purpose,
  onDiscuss,
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
          <div className="mb-1 flex items-center gap-2">
            <span className="t-label text-brand-600">
              Task {i + 1}{total ? ` of ${total}` : ""}
            </span>
            {step.archetype && step.archetype !== "learn_and_do" && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-soft">
                {{
                  critique: "find the flaws",
                  shadow_reproduce: "reproduce it",
                  plot_twist: "expect a twist",
                }[step.archetype] || step.archetype.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <div className={`text-base font-semibold leading-snug ${isDone ? "text-ink-soft line-through" : "text-ink"}`}>
            {t.title || step.topic}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{shorten(step.why, 150)}</p>
        </div>
      </div>
      <MomentFlow
        focus={focus}
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
        prevDraft={prevDraft}
        prevArtifact={prevArtifact}
        allDrafts={allDrafts}
        purpose={purpose}
        onDiscuss={onDiscuss}
      />
    </section>
  );
}

// Beat-level feedback (Sissi's feedback system, users→product direction):
// one tap tells us which beats work and which don't — and a 👎 note becomes
// regeneration context later. V1 stores locally; backend arrives with accounts.
function recordBeatFeedback(plan, entry) {
  try {
    const k = scopedPlanKey("lb_feedback", plan?.learningSequence || []);
    const arr = JSON.parse(localStorage.getItem(k) || "[]");
    arr.push({ ...entry, at: Date.now() });
    localStorage.setItem(k, JSON.stringify(arr.slice(-200)));
  } catch {}
}
function BeatFeedback({ plan, taskIndex, beatKey }) {
  const [state, setState] = useState(null); // null | "up" | "down" | "noted"
  const [note, setNote] = useState("");
  if (state === "noted") return <span className="text-[11px] text-ink-faint">noted — thanks</span>;
  if (state === "down") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          recordBeatFeedback(plan, { taskIndex, beatKey, vote: "down", note: note.trim() });
          setState("noted");
        }}
        className="flex items-center gap-1.5"
      >
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="what's off? (optional)"
          className="w-40 rounded border border-slate-200 px-2 py-1 text-[11px] text-ink focus:outline-none"
        />
        <button type="submit" className="text-[11px] font-medium text-brand-700 hover:underline">
          send
        </button>
      </form>
    );
  }
  return (
    <span className="flex items-center gap-1 text-ink-faint">
      <button
        type="button"
        title="This page helped"
        onClick={() => {
          recordBeatFeedback(plan, { taskIndex, beatKey, vote: "up" });
          setState("noted");
        }}
        className="rounded px-1.5 py-0.5 text-xs hover:bg-slate-100"
      >
        👍
      </button>
      <button
        type="button"
        title="Something's off on this page"
        onClick={() => setState("down")}
        className="rounded px-1.5 py-0.5 text-xs hover:bg-slate-100"
      >
        👎
      </button>
    </span>
  );
}

function MomentFlow({
  focus,
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
  prevDraft,
  prevArtifact,
  allDrafts,
  purpose,
  onDiscuss,
}) {
  const [choice, setChoice] = useState(null);
  // Drill speak loop: the latest confirmed take's delivery signal ({metrics, takes}).
  // SESSION-ONLY by promise — the live copy says takes/metrics are kept "for this
  // session only"; persistence arrives with the trust copy + storybank, not before
  // (the seam rule). Captured here so the Score beat can read what Rehearse produced.
  const [speakSignal, setSpeakSignal] = useState(null);
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
    prevDraft,
    prevArtifact,
    allDrafts,
    purpose,
    onDiscuss,
    speakSignal,
    setSpeakSignal,
  });
  const moment = Math.min(momentIndex || 0, Math.max(0, moments.length - 1));
  const current = moments[moment] || moments[0];

  useEffect(() => {
    setChoice(null);
    setSpeakSignal(null);
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
        {!focus && (
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
        )}
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
          <BeatFeedback plan={plan} taskIndex={moduleIndex} beatKey={current.key} />
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
  prevDraft,
  prevArtifact,
  allDrafts,
  purpose,
  onDiscuss,
  speakSignal,
  setSpeakSignal,
}) {
  const beatId = beatIdentity(purpose);
  const isCurious = purpose === "curious";
  // Fixed grammar, variable inclusion. Code assembles the beats a task has content
  // for: Brief/Coach/Artifact/Reward always; Question/Model/Visual/Practice when
  // their content exists. The model never chooses the flow.
  const artifact = deliverableName(step, moduleIndex);
  const criteria = selfCheck.criteria || [];
  const redFlags = selfCheck.redFlags || [];
  const answered = choice !== null && choice !== undefined;
  const moments = [];

  // BRIEF — Why am I here?
  // Task-boundary honesty: tasks chain on purpose, but the chain must read REAL
  // state. If the previous task's file is empty, say so; if it's written, quote it.
  // Quote the user's WORDS, not the template's scaffolding: skip headings,
  // label lines ("Usable for:"), and empty bullets.
  const prevQuote = (prevDraft || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^#+\s/.test(l) && !/[:：]$/.test(l) && l !== "-" && !/^-\s*$/.test(l))
    .map((l) => l.replace(/^-\s+/, ""))
    .filter((l) => l.length > 12)[0];
  moments.push({
    key: "brief",
    label: beatId.brief[0],
    title: task.title || step.topic,
    objective: beatId.brief[1],
    kicker: null,
    body: (
      <div className="space-y-4">
        {moduleIndex > 0 && prevDraft !== null && !prevDraft.trim() && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-900">
            <span className="font-medium">Heads up:</span> {prevArtifact} from the previous task is still
            empty. You can do this task, but it builds on that file — go back anytime, or continue and
            accept the guesswork.
          </div>
        )}
        {moduleIndex > 0 && prevQuote && (
          <div className="rounded-lg bg-slate-50 px-3 py-2.5">
            <p className="t-label text-ink-faint">From your {prevArtifact}</p>
            <p className="mt-1 text-sm italic leading-relaxed text-ink-soft">“{shorten(prevQuote, 140)}”</p>
          </div>
        )}
        {step.context && (
          <p className="max-w-prose t-body text-ink">{step.context}</p>
        )}
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
          <div className="text-sm leading-relaxed text-ink-soft">
            <p className="font-medium text-ink">You're given:</p>
            <ul className="mt-1 space-y-0.5">
              {task.givenInputs.map((g, k) => {
                // "(from task N)" givens get annotated with the REAL file and its
                // real state — the model narrates the chain; the app verifies it.
                const m = String(g).match(/from (?:task|module)\s*(\d+)/i);
                const refIdx = m ? Number(m[1]) - 1 : -1;
                const valid = refIdx >= 0 && refIdx < moduleIndex && modules?.[refIdx];
                return (
                  <li key={k} className="flex gap-1.5">
                    <span className="text-ink-faint">·</span>
                    <span>
                      {g}
                      {valid && (
                        <span className="text-xs text-ink-faint">
                          {" "}
                          → {deliverableName(modules[refIdx], refIdx)}
                          {(allDrafts?.[refIdx] || "").trim() ? " (written)" : " (still empty)"}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-1.5 text-xs text-ink-faint">
              Practice versions of these are generated for you when you reach the Try page — synthetic, labeled,
              safe to be wrong with.
            </p>
          </div>
        )}
        {task.stakeholders && (
          <p className="text-sm leading-relaxed text-ink-soft">
            <span className="font-medium text-ink">Who uses it:</span> {task.stakeholders}
          </p>
        )}
        {step.askYourTeam?.length > 0 && (
          <div className="rounded-lg bg-slate-50 px-3 py-2.5">
            <p className="t-label text-ink-faint">Ask your team</p>
            <p className="mt-0.5 text-xs text-ink-faint">No plan can know your team's specifics — these questions get them.</p>
            <ul className="mt-2 space-y-1">
              {step.askYourTeam.map((q, k) => (
                <li key={k} className="flex gap-1.5 text-sm leading-relaxed text-ink">
                  <span className="text-brand-600">?</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ),
  });

  // MODEL — What's the idea? (full concept, no truncation)
  // Gated on the label existing: interview purpose has no `model` beat (fork 6),
  // so it never renders even if the model wrongly emits a concept.
  if (concept.explanation && beatId.model) {
    moments.push({
      key: "model",
      label: beatId.model[0],
      title: "The idea you need.",
      objective: beatId.model[1],
      kicker: "One compact model — short enough to use while working.",
      body: (
        <div className="space-y-4">
          {/* Review (5/5 tasks confirmed): the compact model was buried in a
              ~250-word wall under a promise of glanceability. Hoist the first
              sentences — the second-monitor lines — into a box; prose supports. */}
          {(() => {
            const [lead, rest] = splitCompactModel(concept.explanation);
            return (
              <>
                <div className="rounded-lg border border-brand-100 bg-brand-50/50 px-4 py-3">
                  <p className="max-w-prose text-sm font-medium leading-relaxed text-ink">{lead}</p>
                </div>
                {rest && <p className="max-w-prose whitespace-pre-line t-body text-ink-soft">{rest}</p>}
              </>
            );
          })()}
          {/* Definitions live in the Toolbox glossary (≔) — repeating them here
              re-taught the same terms on every page (review item #51). */}
          {concept.keyTerms?.length > 0 && <TermChips keyTerms={concept.keyTerms} />}
          {(concept.traps?.length > 0 || concept.misconceptionToAvoid) && (
            <div className="rounded-md border-l-2 border-amber-300 bg-amber-50 px-3 py-2">
              <p className="text-xs font-medium text-amber-800">Field-tested traps</p>
              <ul className="mt-1 space-y-1">
                {(concept.traps?.length ? concept.traps : [concept.misconceptionToAvoid]).map((t, k) => (
                  <li key={k} className="flex gap-1.5 text-xs leading-relaxed text-amber-800">
                    <span>△</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {step.bridgeFromBackground && (
            <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm italic leading-relaxed text-brand-700">
              ↪ {step.bridgeFromBackground}
            </p>
          )}
          {/* Review ("thin and boring" diagnosis): the verified real-world anchor
              was buried in a collapsed drawer on the Draft page. Surface the
              strongest one HERE, where the concept is taught — a real document
              from the field, catalog-verified, with its quoted key point. */}
          {resourcesDone && resources?.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <p className="t-label text-ink-faint">From the field — real, verified</p>
              <p className="mt-1.5 text-sm font-medium">
                <a
                  href={resources[0].url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-400"
                >
                  {resources[0].title} ↗
                </a>
              </p>
              {resources[0].keyPoint && (
                <blockquote className="mt-1.5 border-l-2 border-slate-200 pl-3 text-xs italic leading-relaxed text-ink-soft">
                  “{resources[0].keyPoint}” <span className="not-italic text-ink-faint">— from the abstract</span>
                </blockquote>
              )}
              {(resources[0].use || resources[0].why) && (
                <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{resources[0].use || resources[0].why}</p>
              )}
            </div>
          )}
        </div>
      ),
    });
  }

  // VISUAL — What does it look like? (worked example as a clean card)
  // Gated on the label existing: interview purpose has no `visual` "hear it" beat.
  if (example.setup && beatId.visual) {
    moments.push({
      key: "visual",
      label: beatId.visual[0],
      title: "See it on one tiny case.",
      objective: beatId.visual[1],
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

  // CHECK — Did the idea land? (after Model + Example — restoring the original order)
  if (comprehension?.question) {
    moments.push({
      key: "question",
      label: beatId.question[0],
      title: comprehension.question,
      objective: beatId.question[1],
      kicker: "Answer from what you just read.",
      body: !comprehension.options?.length ? (
        // Free-text check genres (explain-back / predict / spot-the-flaw): typed
        // answer, graded against the generated key — production, not recognition.
        <FreeTextCheck comprehension={comprehension} task={task} step={step} moduleIndex={moduleIndex} purpose={purpose} />
      ) : (
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

  // PRACTICE — Can I do it myself? One page: here's the job AND the bar.
  // Success criteria are an input to the work, not a postscript (review #33) —
  // the same criteria the Coach review grades against are visible before writing.
  if (task.steps?.length) {
    moments.push({
      key: "practice",
      label: beatId.practice[0],
      title: purpose === "interview" ? "Rehearse it." : purpose === "curious" ? "A tiny try — totally optional." : "Make the first move.",
      objective: beatId.practice[1],
      kicker: "Here's the job, and the bar it will be judged against.",
      body: (
        <div>
          <ol className="space-y-2">
            {task.steps.map((s, k) => (
              <li
                key={k}
                className="flex max-w-prose gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 t-body text-ink"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-50 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
                  {k + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          {task.doneWhen && (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm leading-relaxed text-emerald-800">
              <span className="font-medium">Done when:</span> {task.doneWhen}
            </p>
          )}
          {criteria.length > 0 && (
            <div className="mt-3 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100">
              <p className="t-label text-ink-faint">It will be checked against</p>
              <ul className="mt-1.5 space-y-1">
                {criteria.map((cr, k) => (
                  <li key={k} className="flex gap-1.5 text-xs leading-relaxed text-ink-soft">
                    <span className="text-brand-600">✓</span>
                    <span>{cr}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {redFlags.length > 0 && (
            <div className="mt-3 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100">
              <p className="t-label text-rose-600">Watch for</p>
              <ul className="mt-1.5 space-y-1">
                {redFlags.map((rf, k) => (
                  <li key={k} className="flex gap-1.5 text-xs leading-relaxed text-ink-soft">
                    <span className="text-rose-500">△</span>
                    <span>{rf}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {task.givenInputs?.length > 0 && (
            <div className="mt-3 text-xs leading-relaxed text-ink-soft">
              <p className="font-medium text-ink">Use:</p>
              <ul className="mt-1 space-y-0.5">
                {task.givenInputs.map((g, k) => (
                  <li key={k} className="flex gap-1.5">
                    <span className="text-ink-faint">·</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-3">
            <TaskMaterials step={step} task={task} plan={plan} moduleIndex={moduleIndex} draft={draft} autoStart />
          </div>
          {step.searchLinks?.length > 0 && (
            <div className="mt-3">
              <p className="t-label text-ink-faint">Start your search</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {step.searchLinks.map((l, k) => (
                  <a
                    key={k}
                    href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(l.query)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-200 hover:ring-brand-400"
                  >
                    {l.label} ↗
                  </a>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                Opens LinkedIn search in your own account — you choose who to contact; nothing is sent for you.
              </p>
            </div>
          )}
        </div>
      ),
    });
  }

  // ARTIFACT — What did I produce? (reshuffled BEFORE Coach: you write, then
  // you're reviewed. An empty box in front of someone with no data is where the
  // task dies — the template makes the first keystroke free.)
  // Curious grammar: no homework — draft only if a real tiny-try exists, no coach.
  if (!isCurious || task.steps?.length) moments.push({
    key: "artifact",
    label: beatId.artifact[0],
    title: purpose === "interview" ? "Say your answer, in your words." : purpose === "career_move" ? "Log the evidence." : "Write your draft.",
    objective: beatId.artifact[1],
    kicker: purpose === "interview"
      ? "The room hears an answer, not an essay — what you bank here is what you said."
      : "This is where it becomes yours — part of your final project.",
    body: (
      <div className="space-y-3">
        {purpose === "interview" ? (
          // The drill grammar's decided fork: the typed draft box is replaced by
          // the live speak loop (speak → read it back → confirm). No template
          // button here — scaffolding injected into a transcript box would be
          // graded as words they said, with metrics attached; dig supplies
          // material, the transcript stays theirs. Typed fallback lives inside
          // the panel (VoiceInput), so no one is locked out.
          <SpeakPanel
            step={step}
            moduleIndex={moduleIndex}
            draft={draft}
            onDraftChange={onDraftChange}
            task={task}
            onSignal={setSpeakSignal}
          />
        ) : (
          <>
            {!(draft || "").trim() && (
              <button
                type="button"
                onClick={() => {
                  // Prefer the plan's OWN generated template (from the materials) over
                  // the code-built skeleton — the keyword detector guesses; the
                  // generated template IS the deliverable's shape. (Review item.)
                  const mats = getCachedMaterials(plan, moduleIndex) || [];
                  const tpl = mats.find((m) => /template/i.test(m.filename || ""));
                  onDraftChange(tpl?.content?.trim() ? tpl.content : draftTemplate(task, artifact));
                }}
                className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700 hover:border-brand-400"
              >
                {templateButtonLabel(task)}
              </button>
            )}
            <WorkspacePanel step={step} moduleIndex={moduleIndex} draft={draft} onDraftChange={onDraftChange} />
          </>
        )}
        <DraftLinter draft={draft} plan={plan} moduleIndex={moduleIndex} task={task} />
        <TaskMaterials step={step} task={task} plan={plan} moduleIndex={moduleIndex} draft={draft} autoStart />
        {task.doneWhen && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm leading-relaxed text-emerald-800">
            <span className="font-medium">Done when:</span> {task.doneWhen}
          </p>
        )}
        <NodeResources resources={resources} done={resourcesDone} />
      </div>
    ),
  });

  // COACH — Am I right? (self-check + a real AI review of the draft that now exists)
  if (!isCurious) moments.push({
    key: "coach",
    label: beatId.coach[0],
    title: purpose === "interview" ? "Would this answer land?" : "Self-check, then get a review.",
    objective: beatId.coach[1],
    // Review #78: ticks are PREDICTIONS, not claims — the gap between your ticks
    // and the review is the calibration lesson.
    kicker: "Tick what you think holds — the review will tell you if you're right.",
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
        {/* Watch-for list lives on the Try page (before the work) — repeating it
            here verbatim was noise (review #79). The review below still checks
            against the red flags AND the concept's field-tested traps (#80). */}
        <CoachReview
          draft={draft}
          task={task}
          step={step}
          plan={plan}
          purpose={purpose}
          criteria={criteria}
          redFlags={redFlags}
          concept={concept}
          moduleIndex={moduleIndex}
          onDiscuss={onDiscuss}
        />
      </div>
    ),
  });

  // REWARD — What changed in my project? (reads live state, and only SAYS what
  // the state supports. The gap-closed sentence is the product's core currency —
  // it is never printed for a task whose draft is empty. Review item #44: the old
  // `doneAsIf` here fabricated completion from navigation alone.)
  const ticked = criteria.filter((_, k) => checks.has(`c${k}`)).length;
  const hasDraft = (draft || "").trim().length > 0;
  const allTicked = criteria.length === 0 || ticked === criteria.length;
  const earned = hasDraft && allTicked;
  const doneWith = new Set(done || []);
  if (earned) doneWith.add(moduleIndex);
  const gapReward = earned
    ? getGapClosedReward(plan, modules, done || new Set(), doneWith, moduleIndex, roleName)
    : null;
  const mirrorReward = earned && doneWith.size >= (modules || []).length
    ? getFinalMirrorReward(plan, modules, roleName)
    : null;
  moments.push({
    key: "reward",
    label: beatId.reward[0],
    title: isDone ? "Task complete." : "Add it to your project.",
    objective: beatId.reward[1],
    kicker: null,
    body: isCurious ? (
      // The curious grammar ends at a DOOR, not a receipt — no files, no ticks.
      <div className="space-y-3">
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3">
          <p className="t-label text-brand-600">The door</p>
          <p className="mt-1 text-sm font-medium text-ink">{plan.firstTask?.title || "Where this leads"}</p>
          {plan.firstTask?.why && (
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{plan.firstTask.why}</p>
          )}
          {(plan.firstTask?.phases || [])[0]?.goal && (
            <p className="mt-2 text-sm leading-relaxed text-ink">{plan.firstTask.phases[0].goal}</p>
          )}
          <p className="mt-2 text-xs text-ink-faint">
            If this grabbed you, rebuild with “Exploring a career move” or “Starting a role soon” — your
            background carries over. No pressure either way; that was the point.
          </p>
        </div>
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-ink">
          {nextLabel ? (
            <>
              <span className="font-medium">Next taste:</span> {nextLabel}
            </>
          ) : (
            "That's the whole taste — no homework, nothing to finish."
          )}
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {gapReward && <GapClosedReward reward={gapReward} />}
        {!hasDraft && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">This task isn't done yet.</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-900">
              {/* #98: the final task has no "next task" — it gets capstone phrasing. */}
              {nextLabel
                ? `${artifact} is still empty. Nothing here is graded — but the next task builds on this file. Go back and write it, or move on and accept the gap.`
                : `${artifact} is still empty. Nothing downstream depends on it — but this is your capstone deliverable, the artifact you'd actually show someone. Go back and write it, or move on.`}
            </p>
          </div>
        )}
        {hasDraft && !allTicked && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-ink">Draft in — not yet checked through.</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {criteria.length - ticked} of {criteria.length} criteria still open on the Coach page. The gap
              counts as closed when the draft holds against all of them.
            </p>
          </div>
        )}
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
          ) : earned && doneWith.size >= (modules || []).length ? (
            "That's the last task — your project is assembled. The readiness project below is where you own it end-to-end."
          ) : (
            // #99: "assembled" was printed over a 0-of-N counter. Say what's true.
            "That's the last task. Your project holds whatever you've written so far — the readiness project below is where you own it end-to-end."
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
          placeholder={draftPlaceholder(step?.task || {})}
          className="w-full resize-y border-0 bg-white px-3 py-2 t-body text-ink focus:outline-none focus:ring-0"
        />
      </label>
    </div>
  );
}

// The drill speak loop (interview artifact beat): speak → read it back → confirm.
// Replaces the typed draft box per the drill grammar's decided fork. Reuses
// VoiceInput wholesale — freeze lifeline, typed fallback, no-audio promise, and
// take metrics all come from the one implementation the diagnostic already
// verified. The confirmed transcript IS the answer-bank entry: it flows out
// through onDraftChange into drafts[i], so done-marking, the folder, and export
// work unchanged. Delivery signal rides out via onSignal ({metrics, takes}) —
// session-only, per the live copy's promise (persistence waits for the trust copy).
function SpeakPanel({ step, moduleIndex, draft, onDraftChange, task, onSignal }) {
  const file = deliverableName(step, moduleIndex);
  const words = wordCount(draft);
  // The interviewer's question re-anchors the freeze lifeline; tone dials its
  // register — same source the coach already reads.
  let tone = "";
  try {
    tone = JSON.parse(localStorage.getItem("lb_intake_last") || "{}")?.intake?.tone || "";
  } catch {}
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
        <p className="t-mono min-w-0 break-all text-xs font-medium text-ink">{file}</p>
        <p className="shrink-0 text-xs text-ink-faint">
          {words ? `Saved · ${words} word${words === 1 ? "" : "s"}` : "Not started"}
        </p>
      </div>
      <div className="px-3 pb-3">
        {task.managerRequest && (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-ink">
            {task.managerRequest}
          </p>
        )}
        <VoiceInput
          value={draft || ""}
          onChange={onDraftChange}
          onMetricsChange={onSignal}
          tone={tone}
          question={task.managerRequest || task.title || ""}
        />
        {(draft || "").trim() && (
          // The replay + self-read beat: no TTS exists (fork 6 killed "hear it"),
          // so the replay is the transcript itself, read back deliberately.
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            Read it back the way the room just heard it. If a line doesn't sound
            like you, fix it above before the Score.
          </p>
        )}
      </div>
    </div>
  );
}


// Review item #41: a blank box in front of someone with no data is where the
// task dies. The template is code-built from the task's own fields (deliverable,
// steps) — universal across fields, no extra generation, and it enforces the
// structure the Coach review grades.
// Review #85: the framing adapts to the deliverable TYPE. Five tasks got Task 1's
// memo prompt verbatim; a spec, a table, and a summary each deserve their own shape.
// The compact-model hoist: first sentences (≤ ~220 chars, max 3) become the
// boxed second-monitor lines; the rest becomes supporting prose. The prompt
// already orders explanations model-first, so the split lands on real seams.
function splitCompactModel(text) {
  const t = (text || "").trim();
  if (!t) return ["", ""];
  const sentences = t.match(/[^.!?]+[.!?]+(\s|$)/g) || [t];
  let lead = "";
  let count = 0;
  for (const s of sentences) {
    if (count >= 3 || (lead && lead.length + s.length > 220)) break;
    lead += s;
    count++;
  }
  lead = lead.trim();
  const rest = t.slice(lead.length).trim();
  if (!lead || !rest) return [t, ""];
  return [lead, rest];
}

function deliverableKind(task) {
  const t = `${task?.deliverable || ""} ${task?.title || ""}`.toLowerCase();
  if (/(table|comparison|csv|spreadsheet|dataset)/.test(t)) return "table";
  if (/(spec|specification|definition|plan\b|protocol|rules)/.test(t)) return "spec";
  return "memo";
}

function draftPlaceholder(task) {
  const kind = deliverableKind(task);
  if (kind === "table")
    return "Lay out the table first — rows, columns, the numbers with their raw counts — then the note explaining what it can and can't say.";
  if (kind === "spec")
    return "State the rules precisely: every criterion with its codes, counts, and windows — exact enough that a colleague could rebuild your result.";
  return "Start with the bottom line: what can this support, what can't it support yet, and what must the team confirm?";
}

function templateButtonLabel(task) {
  const kind = deliverableKind(task);
  if (kind === "table") return "Start from a template — the table shape, ready to fill";
  if (kind === "spec") return "Start from a template — the spec shape, ready to fill";
  return "Start from a template — the memo shape, ready to fill";
}

function draftTemplate(task, artifact) {
  const kind = deliverableKind(task);
  const lines = [`# ${task.deliverable || artifact}`, ""];
  if (kind === "table") {
    lines.push(
      "| Group / Item | Count | Denominator | Result |",
      "|---|---|---|---|",
      "|  |  |  |  |",
      "",
      "## How these were produced",
      "- ",
      "",
      "## What this table cannot say",
      "- ",
      ""
    );
  } else if (kind === "spec") {
    lines.push(
      "## Objective",
      "- ",
      "",
      "## Rules (exact codes, counts, windows)",
      "- ",
      "",
      "## What each rule removes, and why",
      "- ",
      ""
    );
  } else {
    lines.push("## Bottom line", "This is usable for:", "- ", "", "It is not yet sufficient for:", "- ", "");
  }
  (task.steps || []).forEach((s, i) => {
    lines.push(`## ${i + 1}. ${s}`, "- ", "");
  });
  lines.push("## Questions for the team", "- ");
  return lines.join("\n");
}

// Review #95 (Door C): the givens become real. For two reviews the plan named
// files that didn't exist — "the most checkable broken promise in the product."
// Instead of shipping a dataset, the model writes SMALL, internally-consistent,
// explicitly-synthetic practice materials for this task on demand (a mini
// extract as a table, a filled example artifact), seeded with the module's own
// traps so they're discoverable, not asserted. User-triggered, cached per task,
// always labeled synthetic.
// Materials cache + world canon are PLAN-scoped (review: task-number-only keys
// leaked one plan's materials into another). The canon — data source type, entity
// identities, code sets, ID scheme — is written by the first generation and is
// LAW for every later task, so Drug A can't change identity between tasks.
function materialsKey(plan, moduleIndex) {
  return scopedPlanKey(`lb_materials_${moduleIndex}`, plan?.learningSequence || []);
}
function canonKey(plan) {
  return scopedPlanKey("lb_canon", plan?.learningSequence || []);
}
function getCachedMaterials(plan, moduleIndex) {
  try {
    if (typeof window === "undefined") return null;
    return JSON.parse(localStorage.getItem(materialsKey(plan, moduleIndex)) || "null");
  } catch {
    return null;
  }
}

// Tiny CSV → table: our generated extracts are ≤30 rows, so "open the CSV as a
// CSV" is a real table, not monospace soup. Falls back to <pre> on anything odd.
function parseCsv(content) {
  const lines = (content || "").trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2 || lines.length > 60) return null;
  const rows = lines.map((l) => l.split(","));
  const w = rows[0].length;
  if (w < 2 || w > 14) return null;
  if (!rows.every((r) => r.length === w)) return null;
  return rows;
}

function MaterialBody({ m }) {
  const isCsv = /\.csv$/i.test(m.filename || "");
  const rows = isCsv ? parseCsv(m.content) : null;
  if (!rows) {
    return (
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap px-3 py-2 text-xs leading-relaxed text-ink">
        {m.content}
      </pre>
    );
  }
  return (
    <div className="max-h-72 overflow-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {rows[0].map((h, i) => (
              <th key={i} className="sticky top-0 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-2 py-1.5 text-left font-semibold text-ink">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((r, i) => (
            <tr key={i} className={i % 2 ? "bg-slate-50/50" : ""}>
              {r.map((c, j) => (
                <td key={j} className="whitespace-nowrap border-b border-slate-100 px-2 py-1 text-ink-soft">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TaskMaterials({ step, task, plan, moduleIndex, draft, autoStart }) {
  const storeKey = materialsKey(plan, moduleIndex);
  const [materials, setMaterials] = useState(() => {
    try {
      if (typeof window === "undefined") return null;
      return JSON.parse(localStorage.getItem(storeKey) || "null");
    } catch {
      return null;
    }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const startedRef = useRef(false);

  const run = async () => {
    setBusy(true);
    setError("");
    try {
      let canon = "";
      try {
        canon = localStorage.getItem(canonKey(plan)) || "";
      } catch {}
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: task.title || step.topic || "",
          deliverable: task.deliverable || "",
          givenInputs: task.givenInputs || [],
          steps: task.steps || [],
          context: step.context || "",
          canon,
          exampleSetup: step.workedExample?.setup || "",
          traps: (step.concept?.traps?.length
            ? step.concept.traps
            : [step.concept?.misconceptionToAvoid]
          ).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Couldn't generate materials.");
      setMaterials(data.materials);
      try {
        localStorage.setItem(storeKey, JSON.stringify(data.materials));
        if (data.entities && !canon) localStorage.setItem(canonKey(plan), data.entities);
      } catch {}
    } catch (e) {
      setError(e?.message || "Couldn't generate materials.");
    }
    setBusy(false);
  };

  // Review: even the reviewer misread the pre-click state four times — a real
  // user always will. On first arrival at a work beat, materials make themselves.
  useEffect(() => {
    if (!autoStart || startedRef.current || materials?.length || busy) return;
    startedRef.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  if (!task.givenInputs?.length) return null;

  const regenerate = () => {
    if ((draft || "").trim()) {
      const ok = window.confirm(
        "Your draft may reference this data — regenerating replaces it with a fresh set. Continue?"
      );
      if (!ok) return;
    }
    run();
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
      <p className="t-label text-ink-faint">Your starting materials</p>
      {!materials?.length ? (
        <div className="mt-1.5">
          <p className="text-xs leading-relaxed text-ink-soft">
            {busy
              ? "Writing your practice materials — a small synthetic set, clearly labeled, safe to be wrong with…"
              : "The materials this task names don't exist until you make them. Generate a small synthetic set to practice on — clearly labeled, safe to be wrong with."}
          </p>
          {!busy && (
            <button
              type="button"
              onClick={run}
              className="mt-2 rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600"
            >
              Generate practice materials
            </button>
          )}
          {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
        </div>
      ) : (
        <div className="mt-2 space-y-3">
          {materials.map((m, k) => (
            <div key={k} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-1.5">
                <p className="t-mono min-w-0 break-all text-xs font-medium text-ink">{m.filename}</p>
                <span className="flex shrink-0 items-center gap-2">
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(m.content)}`}
                    download={m.filename}
                    className="text-[11px] font-medium text-brand-700 hover:underline"
                  >
                    download
                  </a>
                  <span className="text-[11px] text-amber-700">synthetic sample</span>
                </span>
              </div>
              {m.note && <p className="px-3 pt-2 text-xs text-ink-soft">{m.note}</p>}
              <MaterialBody m={m} />
            </div>
          ))}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-ink-faint">
              Generated for practice — internally consistent, not real data.
            </p>
            <button
              type="button"
              onClick={regenerate}
              disabled={busy}
              className="text-[11px] font-medium text-brand-700 hover:underline disabled:opacity-50"
            >
              {busy ? "Regenerating…" : "Regenerate"}
            </button>
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

// The draft linter (feedback batch): a zero-cost, real-time fact spell-checker.
// While you write, it checks that files, codes, and IDs you cite actually exist
// in your practice materials and world canon — the phantom-file catch, live.
// Deliberately conservative: only token classes with digits/extensions, never words.
function draftCitations(draft) {
  const found = new Set();
  const text = draft || "";
  (text.match(/\b[\w-]+\.(?:csv|md|txt|pdf|xlsx|json|sql)\b/gi) || []).forEach((x) => found.add(x));
  (text.match(/\b[A-Z]\d{2}(?:\.\d{1,3})?\b/g) || []).forEach((x) => found.add(x)); // ICD-shaped
  (text.match(/\b\d{4,5}-\d{3,4}(?:-\d{1,2})?\b/g) || []).forEach((x) => found.add(x)); // NDC-shaped
  (text.match(/\b[MP]T?\d{3,}\b/g) || []).forEach((x) => found.add(x)); // member/patient IDs
  return [...found];
}
function DraftLinter({ draft, plan, moduleIndex, task }) {
  const [warnings, setWarnings] = useState([]);
  useEffect(() => {
    const t = setTimeout(() => {
      const mats = getCachedMaterials(plan, moduleIndex) || [];
      if (!mats.length || !(draft || "").trim()) {
        setWarnings([]);
        return;
      }
      let canon = "";
      try {
        canon = localStorage.getItem(canonKey(plan)) || "";
      } catch {}
      const corpus = (
        mats.map((m) => `${m.filename}\n${m.content}`).join("\n") +
        "\n" +
        canon +
        "\n" +
        (task?.givenInputs || []).join("\n")
      ).toLowerCase();
      setWarnings(draftCitations(draft).filter((c) => !corpus.includes(c.toLowerCase())).slice(0, 4));
    }, 800);
    return () => clearTimeout(t);
  }, [draft, plan, moduleIndex, task]);
  if (!warnings.length) return null;
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
      <p className="text-xs font-medium text-amber-900">Cited, but not in your materials:</p>
      <p className="mt-0.5 t-mono text-xs text-amber-800">{warnings.join(" · ")}</p>
      <p className="mt-0.5 text-[11px] text-amber-700">
        Check the spelling against the data — a reviewer would catch this too.
      </p>
    </div>
  );
}

// Free-text check (Sissi: "the questions you ask are not valuable at all"):
// explain-back / predict / spot-the-flaw genres — the learner TYPES an answer
// and it's graded against the generated key via the coach endpoint (~1¢).
// Recognition quizzes test nothing; production does.
function FreeTextCheck({ comprehension, task, step, moduleIndex, purpose }) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const grade = async () => {
    if (!answer.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: answer,
          taskTitle: `Check question: ${comprehension.question}`,
          deliverable: "A short typed answer to the question.",
          doneWhen: "The answer demonstrates the understanding described in the grading key.",
          steps: [],
          purpose: purpose || "starting_role",
          tone: (() => {
            try {
              return JSON.parse(localStorage.getItem("lb_intake_last") || "{}")?.intake?.tone || "";
            } catch {
              return "";
            }
          })(),
          criteria: [comprehension.explanation || "The answer addresses the question correctly."],
          redFlags: (step.concept?.traps || []).slice(0, 2),
          context: (step.concept?.explanation || "").slice(0, 600),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Grading failed.");
      setResult(data.review);
    } catch (e) {
      setError(e?.message || "Grading failed.");
    }
    setBusy(false);
  };

  const verdict = result?.criteria?.[0];
  return (
    <div className="space-y-3">
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={3}
        placeholder="Type your answer in your own words — it gets graded, not pattern-matched."
        className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 t-body text-ink focus:border-brand-300 focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={grade}
          disabled={busy || !answer.trim()}
          className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {busy ? "Grading…" : result ? "Grade again" : "Check my answer"}
        </button>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
      {result && (
        <div
          className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
            verdict?.status === "met"
              ? "bg-emerald-50 text-emerald-800"
              : verdict?.status === "thin"
                ? "bg-amber-50 text-amber-900"
                : "bg-rose-50 text-rose-800"
          }`}
        >
          <p className="font-medium">
            {verdict?.status === "met" ? "Got it." : verdict?.status === "thin" ? "Close — but thin." : "Not yet."}
          </p>
          {verdict?.note && <p className="mt-1">{verdict.note}</p>}
          {result.overall && <p className="mt-1 text-xs opacity-80">{result.overall}</p>}
          {comprehension.explanation && verdict?.status !== "met" && (
            <p className="mt-2 border-t border-current/10 pt-2 text-xs">
              <span className="font-medium">The key:</span> {comprehension.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Review item #34: the load-bearing loop-closer. One model call grades the draft
// against the task's own criteria + red flags. Button-triggered only (never
// auto-fires — each review is a real, if tiny, API spend); the last review is
// kept per task so a refresh doesn't re-bill.
function CoachReview({ draft, task, step, plan, purpose, criteria, redFlags, concept, moduleIndex, onDiscuss }) {
  const storeKey = `lb_review_${moduleIndex}`;
  const [result, setResult] = useState(() => {
    try {
      if (typeof window === "undefined") return null;
      return JSON.parse(localStorage.getItem(storeKey) || "null");
    } catch {
      return null;
    }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const hasDraft = (draft || "").trim().length > 0;

  const run = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft,
          taskTitle: task.title || step.topic || "",
          deliverable: task.deliverable || "",
          doneWhen: task.doneWhen || "",
          steps: task.steps || [],
          criteria,
          // #80: the concept's field-tested traps join the red flags — the plan
          // already knows the domain mistakes; the reviewer should hunt them too.
          redFlags: [
            ...redFlags,
            ...((concept?.traps?.length ? concept.traps : [concept?.misconceptionToAvoid]).filter(Boolean)),
          ],
          context: step.context || "",
          purpose: purpose || "starting_role",
          tone: (() => {
            try {
              return JSON.parse(localStorage.getItem("lb_intake_last") || "{}")?.intake?.tone || "";
            } catch {
              return "";
            }
          })(),
          canon: (() => {
            try {
              return localStorage.getItem(canonKey(plan)) || "";
            } catch {
              return "";
            }
          })(),
          // The coach reviews against the ACTUAL practice data, not just prose —
          // empirical claims (counts, spans) become checkable. (Review item.)
          materials: (getCachedMaterials(plan, moduleIndex) || [])
            .map((m) => `--- ${m.filename} ---\n${(m.content || "").slice(0, 1200)}`)
            .join("\n")
            .slice(0, 4000),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Review failed.");
      setResult(data.review);
      try {
        localStorage.setItem(storeKey, JSON.stringify(data.review));
      } catch {}
    } catch (e) {
      setError(e?.message || "Review failed.");
    }
    setBusy(false);
  };

  if (!hasDraft) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-ink-faint">
        Nothing to review yet — your draft is empty. Go back one page and write a first pass; the review
        reacts to what you actually wrote.
      </p>
    );
  }

  const statusGlyph = (s) => (s === "met" ? "✓" : s === "thin" ? "△" : "✕");
  const statusColor = (s) => (s === "met" ? "text-emerald-600" : s === "thin" ? "text-amber-600" : "text-rose-600");

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
      >
        {busy ? "Reviewing…" : result ? "Review again" : "Review my draft"}
      </button>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      {result && (
        <div className="rounded-lg border border-brand-100 bg-white px-3 py-2.5">
          <p className="t-label text-brand-600">Review</p>
          {result.overall && <p className="mt-1 text-sm leading-relaxed text-ink">{result.overall}</p>}
          {result.criteria?.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {result.criteria.map((c, k) => (
                <li key={k} className="flex gap-1.5 text-xs leading-relaxed">
                  <span className={`shrink-0 ${statusColor(c.status)}`}>{statusGlyph(c.status)}</span>
                  <span className="text-ink-soft">
                    <span className="font-medium text-ink">{shorten(criteria[k] || "", 70)}</span> — {c.note}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {result.redFlagHits?.length > 0 && (
            <div className="mt-2 rounded-md bg-rose-50 px-2.5 py-1.5">
              <p className="t-label text-rose-600">Caught in your draft</p>
              <ul className="mt-1 space-y-1">
                {result.redFlagHits.map((h, k) => (
                  <li key={k} className="flex gap-1.5 text-xs leading-relaxed text-rose-800">
                    <span>△</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.nextEdits?.length > 0 && (
            <div className="mt-2">
              <p className="t-label text-ink-faint">Do next</p>
              <ol className="mt-1 space-y-1">
                {result.nextEdits.map((e, k) => (
                  <li key={k} className="flex gap-1.5 text-xs leading-relaxed text-ink">
                    <span className="font-semibold text-brand-700">{k + 1}.</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[11px] text-ink-faint">
              A starting point, not a sign-off — your team's conventions win.
            </p>
            {onDiscuss && (
              <button
                type="button"
                onClick={() =>
                  onDiscuss(
                    `I just got this review of my draft:\n${result.overall}\n` +
                      result.criteria
                        .map((c, i) => `${i + 1}. [${c.status}] ${c.note}`)
                        .join("\n") +
                      `\n\nHelp me understand what to fix first, and why.`
                  )
                }
                className="shrink-0 text-[11px] font-medium text-brand-700 hover:underline"
              >
                Discuss this review →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Tap-a-term (feedback batch): the glossary, one tap away from the prose it
// serves — each key term is a chip; tapping reveals the plain meaning inline.
function TermChips({ keyTerms }) {
  const [open, setOpen] = useState(null);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-ink-faint">Terms:</span>
        {keyTerms.map((k, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className={`rounded-full px-2 py-0.5 text-xs transition ${
              open === i ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-soft hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            {k.term}
          </button>
        ))}
      </div>
      {open !== null && keyTerms[open] && (
        <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-ink">
          <span className="font-semibold">{keyTerms[open].term}</span> — {keyTerms[open].plainMeaning}
        </p>
      )}
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
  const unteach = check.unteach?.findings || [];

  // Only GENUINE failures drive the visible signal; soft "maybe" flags live inside.
  const failures = missing.length + (scope ? 1 : 0) + vague.length + unteach.length;
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
        {unteach.length > 0 && (
          <Finding tone="amber" title="A senior practitioner would correct these before you repeat them:">
            {unteach.map((u, i) => (
              <li key={i}>
                <strong>{u.module}</strong> — teaches “{u.claim}” · <span className="text-ink-soft">{u.correction}</span>
              </li>
            ))}
          </Finding>
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
            <a
              href={`data:text/markdown;charset=utf-8,${encodeURIComponent(planMarkdown(plan))}`}
              download="labbridge-plan.md"
              className="text-xs font-medium text-brand-700 underline decoration-brand-200 underline-offset-2"
            >
              Download this plan (.md)
            </a>
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
  notes = {},
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
  const markdown = buildProjectMarkdown(projectTitle, modules, fileNames, drafts, done, notes);
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

// Filenames must read like something a human named (Sissi: "01_a_one_page:
// bad title, no one can read and understand it"). Slug the TASK TITLE's first
// few meaningful words, not the whole deliverable sentence.
const FILE_STOPWORDS = new Set(["a","an","the","for","of","to","in","on","with","your","new","that","and","or","from","one","two","three","page","plus","draft","write","produce","build","create","make","hold","against"]);
function deliverableName(step, index) {
  const title = step?.task?.title || step?.topic || `task-${index + 1}`;
  // Review #76: the draft is typed into a plain textarea, so the only honest
  // extension is .md — a name like .pdf/.csv promises a file type the workspace
  // can't produce (and the extension chaos read as carelessness).
  const ext = ".md";
  const words = cleanPoint(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, "")
    .split(/[\s-]+/)
    .filter((w) => w && !FILE_STOPWORDS.has(w) && !/^\d/.test(w))
    .slice(0, 3);
  const base = words.join("_");
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
// Mechanic 2 (Sissi): "I need a time tracker so users know how much time they
// actually work." Shows spent vs planned; with a deadline, a soft pacing word.
function fmtDur(sec) {
  const m = Math.round(sec / 60);
  if (m < 1) return "0m";
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ""}`.trim();
}
function TimeMeter({ modules, timeSpent, deadline, inline }) {
  const spentSec = Object.values(timeSpent || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const plannedH = (modules || []).reduce((acc, m) => {
    if (Number(m?.task?.timeEstimateMin) > 0) return acc + Number(m.task.timeEstimateMin) / 60;
    const hrs = timeboxHours(m?.task?.timebox);
    return acc + (hrs ? (hrs[0] + hrs[1]) / 2 : 0.75);
  }, 0);
  if (!modules?.length) return null;
  const plannedSec = plannedH * 3600;
  let pace = "";
  if (deadline && spentSec > 0) {
    const daysLeft = Math.max(0, Math.ceil((new Date(deadline) - Date.now()) / 86400000));
    const remainH = Math.max(0, plannedSec - spentSec) / 3600;
    pace = remainH < 0.1 ? " · done" : daysLeft <= 0 ? "" : remainH <= daysLeft ? " · on pace" : ` · ~${Math.ceil(remainH)}h left`;
  }
  const text = `${fmtDur(spentSec)} worked · ~${Math.round(plannedH * 10) / 10}h planned${pace}`;
  if (inline) return <span title="Active time only — pauses when you're idle or away">{text}</span>;
  return (
    <p className="text-right text-[11px] text-ink-faint" title="Active time only — pauses when you're idle or away">
      ⏱ {text}
    </p>
  );
}

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

function Roadmap({ plan, modules = [], done = new Set(), trims = [], onToggleTrim, roleName, deadline, purpose }) {
  const strengths = (plan.transferableStrengths || []).slice(0, 4).map((x) => cleanPoint(x.point));
  const ft = plan.firstTask || {};
  const stops = modules.map((m, i) => ({
    i,
    capability: m.topic,
    timebox: m.task?.timebox || "",
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
          {(deadlineSpan(deadline) || ft.horizon) ? ` · ${deadlineSpan(deadline) || ft.horizon}` : ""}
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
          {strengths.length > 0 && (
            // The skips made visible (Sissi): the road's LENGTH is personalization —
            // say out loud that these strengths deleted stops.
            <p className="mt-1 text-xs text-ink-faint">
              — so this road has no stops for what you already do. Your background just made it shorter.
            </p>
          )}
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
              {/* Named, not dreaded (decided): the gap question is visible from
                  minute one, calm, with the promise attached. One register only —
                  no game language here, so the tone dial has nothing to leak. */}
              {purpose === "interview" && <QuestionTag tag={questionTag(modules[stop.i])} />}
              {stop.timebox && !stop.isDone && !stop.isTrimmed && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-ink-soft">{stop.timebox}</span>
              )}
              {stop.isDone && <span className="text-xs font-medium text-emerald-700">done</span>}
              {!stop.isDone && (purpose !== "interview" || isQuestionSkippable(modules[stop.i])) && (
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
                  {stop.isTrimmed ? "keep it after all" : purpose === "interview" ? "I've got this cold" : "I already know this"}
                </button>
              )}
              {!stop.isDone && purpose === "interview" && !isQuestionSkippable(modules[stop.i]) && (
                <span className="text-xs text-ink-faint">required prep</span>
              )}
            </div>
            {purpose === "interview" && (modules[stop.i]?.why || "").trim() && !stop.isTrimmed && (
              <p className="mt-0.5 text-xs italic text-ink-faint">
                from the posting: “{shorten(modules[stop.i].why, 90)}”
              </p>
            )}
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
      {plan?.trims?.length > 0 && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="t-label text-ink-faint">Deferred to fit your runway</p>
          <ul className="mt-1.5 space-y-1">
            {plan.trims.map((t, k) => (
              <li key={k} className="flex gap-1.5 text-xs leading-relaxed text-ink-soft">
                <span className="text-ink-faint">→</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11px] text-ink-faint">Real gaps, honestly cut for time — not forgotten.</p>
        </div>
      )}
      <p className="mt-3 text-xs text-ink-faint">
        Each stop is built from the one before it — nothing here is ornamental.
      </p>
    </section>
  );
}


function firstSentence(text) {
  const t = (text || "").trim();
  const m = t.match(/^[^.!?]*[.!?]/);
  return m ? m[0] : t;
}


// UI owns the calendar (date-fidelity: the model speaks in relative windows; the
// app renders the user's real dates). "Jul 11 → Aug 7 · ~4 weeks", or null.
function deadlineSpan(deadline) {
  if (!deadline) return null;
  const end = new Date(`${deadline}T00:00:00`);
  if (isNaN(end)) return null;
  const now = new Date();
  const days = Math.ceil((end - now) / 86400000);
  if (days <= 0) return null;
  const weeks = Math.max(1, Math.round(days / 7));
  const fmt = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(now)} → ${fmt(end)} · ~${weeks} week${weeks === 1 ? "" : "s"}`;
}


// ——— The Toolbox (Sissi's 沉浸式 learning tools): quiet help at the screen's
// edge — Notes (thinking space, separate from the Draft, exports with the
// project), Glossary (every key term in the plan, searchable), Snapshot (capture
// the current moment into notes), and — in the demo only — the sample Coach.
// The rail is the one piece of chrome that survives focus mode.
function momentSnapshotText(step, key) {
  const t = step?.task || {};
  const c = step?.concept || {};
  const ex = step?.workedExample || {};
  if (key === "model")
    return [c.explanation, ...(c.keyTerms || []).map((k) => `${k.term} — ${k.plainMeaning}`)].filter(Boolean).join("\n");
  if (key === "visual") return [ex.setup, ...(ex.walkThrough || []), ex.takeaway].filter(Boolean).join("\n");
  if (key === "question")
    return [step?.comprehensionCheck?.question, step?.comprehensionCheck?.explanation].filter(Boolean).join("\n");
  if (key === "practice") return (t.steps || []).join("\n");
  if (key === "coach") return [...(step?.selfCheck?.criteria || []), ...(step?.selfCheck?.redFlags || [])].join("\n");
  return [step?.context, t.managerRequest, t.deliverable].filter(Boolean).join("\n");
}

// Split-pane assistant (Sissi): "read information and use the chatbot at the
// same time." A docked right panel, not an overlay — the content column yields.
// The whole value is CONTEXT INJECTION: every message automatically carries the
// current beat, the task, the materials, and the draft, and the reply must
// anchor back to the page (honesty rules inherited from the plan contract).
function AssistantPanel({ onClose, module, moduleIndex, beatKey, plan, draft, purpose, seed, onSeedConsumed }) {
  const storeKey = scopedPlanKey(`lb_chat_${moduleIndex}`, plan?.learningSequence || []);
  const [messages, setMessages] = useState(() => {
    try {
      if (typeof window === "undefined") return [];
      return JSON.parse(localStorage.getItem(storeKey) || "[]");
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  // "Discuss this review": the coach hands its verdict to the panel as a seed —
  // one auto-sent message (the user's click on Discuss WAS the consent).
  const seedRef = useRef(false);
  useEffect(() => {
    if (!seed || seedRef.current || busy) return;
    seedRef.current = true;
    send(seed);
    onSeedConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const send = async (text) => {
    const q = (text || "").trim();
    if (!q || busy) return;
    const nextMsgs = [...messages, { role: "user", content: q }];
    setMessages(nextMsgs);
    setInput("");
    setBusy(true);
    setError("");
    try {
      let canon = "";
      try {
        canon = localStorage.getItem(canonKey(plan)) || "";
      } catch {}
      const materials = (getCachedMaterials(plan, moduleIndex) || [])
        .map((m) => `--- ${m.filename} ---\n${(m.content || "").slice(0, 900)}`)
        .join("\n")
        .slice(0, 3000);
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMsgs.slice(-8),
          context: {
            purpose: purpose || "starting_role",
            ...(() => {
              // Dig material for the interview assistant (drill spec): the tone
              // dial, their resume, and what they already said out loud in the two
              // diagnostic questions — what their own claims are grounded in and
              // what dig points back to when it recommends making a spark theirs.
              try {
                const last = JSON.parse(localStorage.getItem("lb_intake_last") || "{}");
                const tone = last?.intake?.tone || "";
                if (purpose !== "interview") return { tone };
                const dg = last?.diagnostic || {};
                const diagnostic = ["q1", "q2"]
                  .map((k) => (dg[k]?.answer || "").trim())
                  .filter(Boolean)
                  .map((a, i) => `Q${i + 1}: ${a}`)
                  .join("\n\n");
                return { tone, resume: last?.resume || "", diagnostic };
              } catch {
                return { tone: "" };
              }
            })(),
            taskTitle: module?.task?.title || module?.topic || "",
            beatKey: beatKey || "",
            beatContent: momentSnapshotText(module, beatKey).slice(0, 2500),
            concept: (module?.concept?.explanation || "").slice(0, 1500),
            draft: (draft || "").slice(0, 2000),
            materials,
            canon,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Assistant failed.");
      const withReply = [...nextMsgs, { role: "assistant", content: data.reply }];
      setMessages(withReply);
      try {
        localStorage.setItem(storeKey, JSON.stringify(withReply.slice(-30)));
      } catch {}
    } catch (e) {
      setError(e?.message || "Assistant failed.");
      setMessages(nextMsgs); // keep the user's question visible for retry
    }
    setBusy(false);
  };

  const quick = [
    { label: "Explain simpler", q: "Explain what this page teaches in simpler words, using my background." },
    { label: "Another example", q: "Give me one more tiny concrete example of this idea." },
    { label: "Quiz me", q: "Ask me one question to test whether I understood this page. Wait for my answer." },
  ];

  return (
    <aside
      className="fixed right-0 top-0 z-40 flex h-full w-full flex-col border-l border-slate-200 bg-white shadow-xl sm:w-[400px]"
      aria-label="AI assistant"
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p className="t-label text-brand-600">Ask about this page</p>
          <p className="truncate text-xs text-ink-faint">{module?.task?.title || module?.topic}</p>
        </div>
        <button type="button" onClick={onClose} className="shrink-0 text-xs text-ink-faint hover:text-ink">
          Close ✕
        </button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-ink-soft">
            I can see the page you're reading, your materials, and your draft — ask about any of it. I'll flag
            team-specific conventions to confirm locally, and I won't invent facts about your company.
          </p>
        )}
        {messages.map((m, k) => (
          <div key={k} className={m.role === "user" ? "ml-auto w-fit max-w-[88%]" : "w-fit max-w-[92%]"}>
            <p
              className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed ${
                m.role === "user" ? "bg-brand-100 text-brand-900" : "bg-white text-ink ring-1 ring-slate-100"
              }`}
            >
              {m.content}
            </p>
          </div>
        ))}
        {busy && <p className="text-xs text-ink-faint">Thinking…</p>}
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>

      <div className="border-t border-slate-100 px-4 py-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {quick.map((qa) => (
            <button
              key={qa.label}
              type="button"
              onClick={() => send(qa.q)}
              disabled={busy}
              className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-brand-700 ring-1 ring-brand-100 hover:ring-brand-300 disabled:opacity-50"
            >
              {qa.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about what you're reading…"
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink focus:border-brand-300 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            →
          </button>
        </form>
      </div>
    </aside>
  );
}

function Toolbox({ modules, activeIndex, activeModule, activeMomentKey, notes, onNotes, drafts, checksByTask, openTool, setOpenTool, onAssistant, assistantOpen }) {
  const [demo] = useState(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem("lb_mock") === "1";
    } catch {
      return false;
    }
  });
  const [snapped, setSnapped] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!openTool) return;
    const onKey = (e) => e.key === "Escape" && setOpenTool(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openTool, setOpenTool]);

  const snapshot = () => {
    const label = getMomentMeta(activeModule)[0] ? activeMomentKey : "";
    const text = momentSnapshotText(activeModule, activeMomentKey);
    if (!text) return;
    const stamp = `\n\n📌 ${deliverableName(activeModule, activeIndex)} · ${label}\n${text}\n`;
    onNotes(activeIndex, ((notes[activeIndex] || "") + stamp).trimStart());
    setSnapped(true);
    setTimeout(() => setSnapped(false), 1500);
    setOpenTool("notes");
  };

  const allTerms = (modules || []).flatMap((m, i) =>
    (m.concept?.keyTerms || []).map((k) => ({ ...k, from: m.topic, i }))
  );
  const q = query.trim().toLowerCase();
  const terms = q ? allTerms.filter((t) => `${t.term} ${t.plainMeaning}`.toLowerCase().includes(q)) : allTerms;

  const tools = [
    { key: "assistant", glyph: "✳", label: "Ask AI — opens a side panel so you can read and ask at once" },
    { key: "notes", glyph: "✎", label: "Notes" },
    { key: "glossary", glyph: "≔", label: "Glossary" },
    { key: "snapshot", glyph: "⌗", label: snapped ? "Saved ✓" : "Snapshot this moment" },
    ...(demo ? [{ key: "coach", glyph: "◉", label: "Coach (sample)" }] : []),
  ];

  return (
    <>
      <div className="fixed right-3 top-1/2 z-30 -translate-y-1/2 flex flex-col gap-1.5 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm">
        {tools.map((t) => (
          <button
            key={t.key}
            type="button"
            title={t.label}
            aria-label={t.label}
            onClick={() =>
              t.key === "snapshot" ? snapshot() : t.key === "assistant" ? onAssistant?.() : setOpenTool(openTool === t.key ? null : t.key)
            }
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition ${
              openTool === t.key || (t.key === "assistant" && assistantOpen)
                ? "bg-brand-600 text-white"
                : "text-ink-soft hover:bg-slate-100 hover:text-ink"
            }`}
          >
            {t.key === "snapshot" && snapped ? "✓" : t.glyph}
          </button>
        ))}
      </div>

      {openTool && (
        <div className="fixed right-16 top-1/2 z-30 w-[min(360px,85vw)] max-h-[72vh] -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <p className="t-label text-ink-faint">
              {openTool === "notes" ? "Notes" : openTool === "glossary" ? "Glossary" : "Coach — sample (demo)"}
            </p>
            <button type="button" onClick={() => setOpenTool(null)} className="text-xs text-ink-faint hover:text-ink">
              Esc ✕
            </button>
          </div>

          {openTool === "notes" && (
            <div className="mt-2">
              <p className="t-mono text-xs text-ink-soft">{deliverableName(activeModule, activeIndex)}</p>
              <textarea
                value={notes[activeIndex] || ""}
                onChange={(e) => onNotes(activeIndex, e.target.value)}
                rows={10}
                placeholder="Your thinking space — separate from the draft. Exports with your project."
                className="mt-2 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 t-body text-ink focus:outline-none"
              />
              {Object.entries(notes).filter(([k, v]) => Number(k) !== activeIndex && (v || "").trim()).length > 0 && (
                <div className="mt-3 border-t border-slate-100 pt-2">
                  <p className="text-xs text-ink-faint">Other tasks</p>
                  {Object.entries(notes)
                    .filter(([k, v]) => Number(k) !== activeIndex && (v || "").trim())
                    .map(([k, v]) => (
                      <p key={k} className="mt-1 truncate text-xs text-ink-soft">
                        <span className="t-mono">{deliverableName(modules[Number(k)], Number(k))}</span> — {v.slice(0, 60)}
                      </p>
                    ))}
                </div>
              )}
            </div>
          )}

          {openTool === "glossary" && (
            <div className="mt-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search every term in your plan…"
                className="w-full rounded-md border border-slate-200 px-3 py-2 t-body text-ink focus:outline-none"
              />
              <dl className="mt-3 space-y-2">
                {terms.map((t, k) => (
                  <div key={k}>
                    <dt className="text-sm font-semibold text-ink">{t.term}</dt>
                    <dd className="text-sm leading-relaxed text-ink-soft">{t.plainMeaning}</dd>
                  </div>
                ))}
                {!terms.length && <p className="text-sm text-ink-faint">No term matches.</p>}
              </dl>
            </div>
          )}

          {openTool === "coach" && activeModule && (
            <div className="mt-2">
              <SampleCoaching
                draft={drafts[activeIndex] || ""}
                criteria={activeModule.selfCheck?.criteria || []}
                checks={new Set(checksByTask?.[activeIndex] || [])}
                redFlags={activeModule.selfCheck?.redFlags || []}
                concept={activeModule.concept || {}}
                task={activeModule.task || {}}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}


// Official YouTube embed only (sanctioned by YouTube ToS; verified via oEmbed
// before a video ever enters the demo/pipeline). nocookie domain = privacy mode.
function youtubeId(url) {
  const m = (url || "").match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}


// The full generated plan as a portable markdown file — for saving a paid plan
// outside the browser and sharing it (validation reviews, expert spot-checks).
function planMarkdown(plan) {
  const L = [];
  const push = (...x) => L.push(...x, "");
  push(`# Onboarding plan`);
  if (plan.northStar) push(`**Mission:** ${plan.northStar}`);
  if (plan.hook) push(plan.hook);
  if (plan.transferableStrengths?.length) {
    push(`## What you already bring`);
    plan.transferableStrengths.forEach((x) => push(`- **${x.point}** — ${x.detail}`));
  }
  if (plan.knowledgeGaps?.length) {
    push(`## What's actually missing`);
    plan.knowledgeGaps.forEach((x) => push(`- **${x.point}** — ${x.detail}`));
  }
  (plan.learningSequence || []).forEach((m, i) => {
    push(`## Task ${i + 1}: ${m.task?.title || m.topic}`);
    if (m.context) push(m.context);
    if (m.why) push(`**Why now:** ${m.why}`);
    if (m.bridgeFromBackground) push(`**Bridge:** ${m.bridgeFromBackground}`);
    if (m.concept?.explanation) push(`### Concept`, m.concept.explanation);
    (m.concept?.keyTerms || []).forEach((k) => push(`- **${k.term}** — ${k.plainMeaning}`));
    const traps = m.concept?.traps?.length ? m.concept.traps : m.concept?.misconceptionToAvoid ? [m.concept.misconceptionToAvoid] : [];
    if (traps.length) {
      push(`### Field-tested traps`);
      traps.forEach((t) => push(`- ${t}`));
    }
    if (m.workedExample?.setup) {
      push(`### Worked example`, m.workedExample.setup);
      (m.workedExample.walkThrough || []).forEach((x, k) => push(`${k + 1}. ${x}`));
      if (m.workedExample.takeaway) push(`**Takeaway:** ${m.workedExample.takeaway}`);
    }
    if (m.comprehensionCheck?.question)
      push(`### Check`, m.comprehensionCheck.question, `Answer: ${m.comprehensionCheck.options?.[m.comprehensionCheck.answerIndex] || ""} — ${m.comprehensionCheck.explanation || ""}`);
    if (m.task) {
      push(`### Assignment`);
      if (m.task.managerRequest) push(`> ${m.task.managerRequest}`);
      if (m.task.givenInputs?.length) push(`**Given:** ${m.task.givenInputs.join(", ")}`);
      (m.task.steps || []).forEach((x, k) => push(`${k + 1}. ${x}`));
      if (m.task.deliverable) push(`**Deliverable:** ${m.task.deliverable}`);
      if (m.task.timebox) push(`**Timebox:** ${m.task.timebox}`);
      if (m.task.doneWhen) push(`**Done when:** ${m.task.doneWhen}`);
      if (m.task.stakeholders) push(`**Who consumes it:** ${m.task.stakeholders}`);
    }
    if (m.askYourTeam?.length) {
      push(`### Ask your team`);
      m.askYourTeam.forEach((q) => push(`- ${q}`));
    }
    if (m.selfCheck?.criteria?.length) {
      push(`### Self-check`);
      m.selfCheck.criteria.forEach((c) => push(`- [ ] ${c}`));
      (m.selfCheck.redFlags || []).forEach((r) => push(`- ⚠ ${r}`));
    }
  });
  if (plan.firstTask) {
    push(`## Readiness project: ${plan.firstTask.title || ""}`);
    if (plan.firstTask.why) push(plan.firstTask.why);
    (plan.firstTask.phases || []).forEach((ph) => push(`- **${ph.stage}** (${ph.timing}): ${ph.goal}`));
  }
  if (plan.timelineNote) push(`**Pace:** ${plan.timelineNote}`);
  return L.join("\n");
}
