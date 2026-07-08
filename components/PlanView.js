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
      const topics = plan.learningSequence.map((s, i) => ({ index: i, topic: s.topic, why: s.why }));
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
        topics: topics.map((t) => ({ index: t.index, topic: t.topic, why: t.why, pool: pools[t.index] || [] })),
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
        <p className="mt-4 text-sm font-medium text-ink">Building your onboarding plan…</p>
        <p className="mt-1 text-xs text-ink-faint">Reading your background and mapping the path. ~10–20s.</p>
      </div>
    );
  }

  const depthLabel = DEPTH_OPTIONS.find((d) => d.key === form.goals.depth)?.label;
  const purposeLabel = PURPOSE_OPTIONS.find((p) => p.key === form.goals.purpose)?.label;
  const jf = payload.target.jobFields;
  const roleRaw = (form.headed.role || "").trim();
  const roleName = (roleRaw && !looksLikeUrl(roleRaw) ? roleRaw : null) || jf?.role || null;
  const company = jf?.company || null;

  return (
    <div className="fade-up space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-500">Your onboarding plan</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          {roleName ? `Toward ${roleName}${company ? ` at ${company}` : ""}` : "Where you're headed"}
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

      {payload.target.unreadableLink && (
        <Note tone="warn">
          We couldn't read a job link you added — the site may block automated reading. This plan is built from your
          background and any other materials, <strong>not</strong> that posting. Paste the job description text in
          section 2 to target the exact role and company.
        </Note>
      )}

      <Card title="What you already bring" accent>
        <PointList items={plan.transferableStrengths} />
      </Card>

      <Card title="What's actually missing">
        <PointList items={plan.knowledgeGaps} />
      </Card>

      <Card title="Your learning path" subtitle="In order — each step builds on the last.">
        <ol className="space-y-4">
          {plan.learningSequence.map((s, i) => (
            <li key={i} className="relative pl-8">
              <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
                {i + 1}
              </span>
              <div className="font-medium text-ink">{s.topic}</div>
              <div className="mt-0.5 text-sm text-ink-soft">{s.why}</div>
              <NodeResources resources={topicResources[i]} done={resourcesDone} />
            </li>
          ))}
        </ol>
      </Card>

      {augmenting && (
        <p className="text-xs text-ink-faint">Adding official docs &amp; courses to each step…</p>
      )}

      <Note>
        <strong>Resources are retrieved and verified before they're picked</strong> — candidate books, papers, and
        courses are resolved against Open Library, OpenAlex, or an official web page, and the plan selects from only
        what's real. Every link opens the real source; a step with no vetted match is flagged honestly rather than
        filled with a guess.
      </Note>

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
    return <p className="mt-2 text-xs text-ink-faint">finding vetted resources…</p>;
  }
  if (!resources?.length) {
    return (
      <p className="mt-2 text-xs italic text-ink-faint">
        No vetted resource found for this step yet — flagged for review.
      </p>
    );
  }
  return (
    <ul className="mt-2 space-y-2">
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
          {r.why && <div className="mt-0.5 text-xs text-ink-soft">{r.why}</div>}
        </li>
      ))}
    </ul>
  );
}

function CheckReview({ check, checking }) {
  if (!check) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-ink">Plan self-check</h2>
        <p className="mt-2 text-sm text-ink-faint">
          {checking ? "Reviewing for over-teaching and first-task gaps…" : "—"}
        </p>
      </section>
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
  const clean = !known.length && !otReview.length && !missing.length && !vague.length && !ftReview.length && !scope;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-ink">Plan self-check</h2>
      <p className="mt-0.5 text-xs text-ink-soft">
        An automated review compared the plan against your background and itself — it points, you decide.
      </p>
      {clean ? (
        <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          ✓ No over-teaching or missing prerequisites found.
        </p>
      ) : (
        <div className="mt-3 space-y-3 text-sm">
          {known.length > 0 && (
            <Finding tone="amber" title="You may already know these — consider trimming:">
              {known.map((k, i) => (
                <li key={i}>
                  <strong>{cleanTopic(k.node)}</strong> — <span className="text-ink-soft">{k.evidence}</span>
                </li>
              ))}
            </Finding>
          )}
          {missing.length > 0 && (
            <Finding tone="amber" title="The first task may need skills the plan didn't cover:">
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
            <Finding tone="slate" title="First task could be more concrete:">
              {vague.map((v, i) => (
                <li key={i}>{v}</li>
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
      )}
    </section>
  );
}

function cleanTopic(s) {
  return (s || "").split(" — ")[0];
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
