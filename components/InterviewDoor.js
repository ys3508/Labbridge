"use client";

// The interview door (interview-mode-spec §input door, revised after the form
// review): facts and feelings don't share a box. Round/interviewer kind/format
// are CHIPS (the chip IS the structured data — no parsing); the challenge field
// stands alone as fear's single home, visually distinct; interviewers are repeatable rows
// (a panel is several people with several styles); ammunition moved into the
// diagnostic (asked warm, after Q1's feedback, where people are talking).
// Grouped into four short sections with an honest time promise up top.

import { useState } from "react";
import BackgroundSection from "@/components/BackgroundSection";

const field =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 t-body text-ink focus:border-brand-300 focus:outline-none";

const ROUNDS = ["First round", "Middle", "Final", "Not sure"];
const INTERVIEWER_KINDS = ["Recruiter", "Hiring manager", "Engineer / peer", "Exec", "Panel", "Not sure"];
const FORMATS = ["Phone", "Video", "In person", "Panel", "Take-home"];
const SENIORITY = ["First role in this field", "Stepping up", "Same level, new field", "Senior in this field"];

function Chips({ options, value, onChange }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(value === o ? "" : o)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            value === o
              ? "bg-brand-600 text-white"
              : "bg-white text-ink-soft ring-1 ring-slate-200 hover:text-ink hover:ring-brand-300"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function GroupHeader({ children }) {
  return <p className="border-b border-slate-200 pb-1 t-label text-ink-faint">{children}</p>;
}

const EMPTY_INTERVIEWER = { name: "", about: "", url: "", urlStatus: null };

export default function InterviewDoor({ background, onBackground, onContinue, onBack }) {
  const [jd, setJd] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [role, setRole] = useState("");
  const [seniority, setSeniority] = useState("");
  const [round, setRound] = useState("");
  const [interviewerKind, setInterviewerKind] = useState("");
  const [format, setFormat] = useState("");
  const [challenge, setChallenge] = useState("");
  const [interviewers, setInterviewers] = useState([{ ...EMPTY_INTERVIEWER }]);
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);

  const canContinue = jd.trim().length > 40 || role.trim();

  const setInterviewer = (i, patch) =>
    setInterviewers((arr) => arr.map((iv, k) => (k === i ? { ...iv, ...patch } : iv)));

  // Attempt the profile link immediately (same consent pattern as job-posting
  // links). LinkedIn blocks automated reading almost always — so the honest
  // failure surfaces HERE, at the field, not at generation.
  const tryUrl = async (i) => {
    const url = (interviewers[i]?.url || "").trim();
    if (!url) return;
    setInterviewer(i, { urlStatus: "checking" });
    try {
      const res = await fetch("/api/read-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data?.ok && data.text) setInterviewer(i, { urlStatus: "ok", about: (interviewers[i].about || "") || data.text.slice(0, 1500) });
      else setInterviewer(i, { urlStatus: "unreadable" });
    } catch {
      setInterviewer(i, { urlStatus: "unreadable" });
    }
  };

  const go = async () => {
    setBusy(true);
    let intake = null;
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jd,
          challenge,
          round,
          interviewer_kind: interviewerKind,
          format,
          seniority,
          resume: background?.resume || "",
        }),
      });
      intake = await res.json();
      if (intake?.error) intake = null;
    } catch {
      intake = null;
    }
    const interviewerText = interviewers
      .filter((iv) => iv.name.trim() || iv.about.trim())
      .map((iv) => `${iv.name || "Interviewer"}: ${iv.about}`.trim())
      .join("\n");
    try {
      localStorage.setItem(
        "lb_intake_last",
        JSON.stringify({ intake, company, website, interviewers: interviewerText, at: Date.now() })
      );
    } catch {}
    onContinue(
      { jd, company, website, role, seniority, round, interviewerKind, format, challenge, interviewers: interviewerText, date },
      intake
    );
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-2xl fade-up">
      <button onClick={onBack} className="text-sm font-medium text-ink-soft hover:text-ink">
        ← Back
      </button>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Your interview</h1>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-soft">
        About two minutes. The more real material you give, the more your answers can be built from your
        actual life — and nothing here is stored anywhere but your browser.
      </p>

      <div className="mt-6 space-y-7">
        {/* ——— THE INTERVIEW ——— */}
        <div className="space-y-4">
          <GroupHeader>The interview</GroupHeader>
          <label className="block">
            <span className="text-sm font-medium text-ink">The job description</span>
            <span className="ml-2 text-xs text-ink-faint">every question we prep will cite a line of it</span>
            <textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={7} placeholder="Paste the posting here." className={`mt-1.5 ${field}`} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-ink">Company</span>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Who's hiring?" className={`mt-1.5 ${field}`} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink">
                Their website <span className="text-xs font-normal text-ink-faint">(optional — helps when names collide)</span>
              </span>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="company.com" className={`mt-1.5 ${field}`} />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-ink">Role</span>
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="The title you're interviewing for" className={`mt-1.5 ${field}`} />
          </label>
          <div>
            <span className="text-sm font-medium text-ink">What round is it?</span>
            <span className="ml-2 text-xs text-ink-faint">breadth vs. depth</span>
            <Chips options={ROUNDS} value={round} onChange={setRound} />
          </div>
          <div>
            <span className="text-sm font-medium text-ink">Who's leading the room?</span>
            <span className="ml-2 text-xs text-ink-faint">one tap shapes the question mix</span>
            <Chips options={INTERVIEWER_KINDS} value={interviewerKind} onChange={setInterviewerKind} />
          </div>
          <div>
            <span className="text-sm font-medium text-ink">What format?</span>
            <Chips options={FORMATS} value={format} onChange={setFormat} />
          </div>
        </div>

        {/* ——— YOU ——— */}
        <div className="space-y-4">
          <GroupHeader>You</GroupHeader>
          <div>
            <p className="text-sm font-medium text-ink">
              Your background{" "}
              <span className="text-xs font-normal text-ink-faint">so your answers come from your life</span>
            </p>
            <div className="mt-1.5">
              <BackgroundSection value={background} onChange={onBackground} embedded />
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-ink">How senior is this role, for you?</span>
            <Chips options={SENIORITY} value={seniority} onChange={setSeniority} />
          </div>
          {/* The emotional intake — fear's single home, and it should look like
              it matters more, because it does. */}
          <label className="block rounded-xl border border-brand-200 bg-brand-50/40 p-4">
            <span className="text-sm font-semibold text-ink">The hardest part of this, for you</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
              The question you're dreading, nerves, explaining a gap or layoff, interviewing in your second
              language — whatever it actually is. This is the field that shapes how we coach you.
            </span>
            <textarea
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              rows={3}
              className={`mt-2 ${field}`}
            />
          </label>
        </div>

        {/* ——— THE ROOM ——— */}
        <div className="space-y-4">
          <GroupHeader>The room</GroupHeader>
          <div>
            <p className="text-sm font-medium text-ink">
              Who's interviewing you? <span className="text-xs font-normal text-ink-faint">(optional)</span>
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-faint">
              Stays on your device; used only to calibrate the prep. A link is worth a try, but LinkedIn
              usually blocks reading — if it fails, paste their “About” text instead.
            </p>
            <div className="mt-2 space-y-3">
              {interviewers.map((iv, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                  <input
                    value={iv.name}
                    onChange={(e) => setInterviewer(i, { name: e.target.value })}
                    placeholder="Name and title (e.g. Jane — VP Medical Affairs)"
                    className={field}
                  />
                  <div className="mt-2 flex gap-2">
                    <input
                      value={iv.url}
                      onChange={(e) => setInterviewer(i, { url: e.target.value, urlStatus: null })}
                      onBlur={() => tryUrl(i)}
                      placeholder="Profile link (we'll try to read it)"
                      className={field}
                    />
                  </div>
                  {iv.urlStatus === "checking" && <p className="mt-1 text-xs text-ink-faint">Trying the link…</p>}
                  {iv.urlStatus === "unreadable" && (
                    <p className="mt-1 text-xs text-amber-700">
                      Couldn't read it (LinkedIn blocks this — honestly, it usually does). Paste their “About”
                      below instead.
                    </p>
                  )}
                  {iv.urlStatus === "ok" && <p className="mt-1 text-xs text-emerald-700">Read it — added below; edit freely.</p>}
                  <textarea
                    value={iv.about}
                    onChange={(e) => setInterviewer(i, { about: e.target.value })}
                    rows={2}
                    placeholder="Their background — LinkedIn 'About', publications, anything you know."
                    className={`mt-2 ${field}`}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setInterviewers((arr) => [...arr, { ...EMPTY_INTERVIEWER }])}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                + Add another interviewer
              </button>
            </div>
          </div>
        </div>

        {/* ——— WHEN ——— */}
        <div className="space-y-4">
          <GroupHeader>When</GroupHeader>
          <label className="block sm:w-1/2">
            <span className="text-sm font-medium text-ink">When is the interview?</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`mt-1.5 ${field}`} />
          </label>
        </div>

        <button
          type="button"
          disabled={!canContinue || busy}
          onClick={go}
          className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {busy ? "Reading your intake…" : "Continue — two questions before anything else →"}
        </button>
      </div>
    </div>
  );
}
