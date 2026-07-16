"use client";

// The interview door (interview-mode-spec §input door): a purpose-built intake,
// deliberately a PARALLEL PATH — the classic form is untouched. Field order is
// the spec's: JD (the field) → company → role → resume (urged) → the interview
// (round/format/worry) → the challenge → ammunition → interviewers → the date.
// On continue: ONE intake call (~1-2¢) returns signals + Q2 + grading keys +
// (for fused/vulnerable intake) a model-written contract line.

import { useState } from "react";
import BackgroundSection from "@/components/BackgroundSection";

const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 t-body text-ink focus:border-brand-300 focus:outline-none";

export default function InterviewDoor({ background, onBackground, onContinue, onBack }) {
  const [jd, setJd] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [roundWorry, setRoundWorry] = useState("");
  const [challenge, setChallenge] = useState("");
  const [ammunition, setAmmunition] = useState("");
  const [interviewers, setInterviewers] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canContinue = jd.trim().length > 40 || role.trim();

  const go = async () => {
    setBusy(true);
    setError("");
    let intake = null;
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jd,
          worry: roundWorry,
          challenge,
          round: roundWorry,
          resume: background?.resume || "",
        }),
      });
      intake = await res.json();
      if (intake?.error) throw new Error(intake.error);
    } catch (e) {
      // The door still opens on router failure — deterministic fallbacks only.
      intake = null;
      setError("");
    }
    try {
      localStorage.setItem("lb_intake_last", JSON.stringify({ intake, company, interviewers, at: Date.now() }));
    } catch {}
    onContinue({ jd, company, role, roundWorry, challenge, ammunition, interviewers, date }, intake);
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-2xl fade-up">
      <button onClick={onBack} className="text-sm font-medium text-ink-soft hover:text-ink">
        ← Back
      </button>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Your interview</h1>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-soft">
        Paste what you have. The more real material you give, the more every answer gets built from your
        actual life — nothing here is stored anywhere but your browser.
      </p>

      <div className="mt-6 space-y-5">
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
            <span className="text-sm font-medium text-ink">Role</span>
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="The title you're interviewing for" className={`mt-1.5 ${field}`} />
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">
            Your background <span className="ml-2 text-xs font-normal text-ink-faint">add it — every answer gets built from your life</span>
          </p>
          <div className="mt-1.5">
            <BackgroundSection value={background} onChange={onBackground} />
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-ink">The interview itself</span>
          <textarea
            value={roundWorry}
            onChange={(e) => setRoundWorry(e.target.value)}
            rows={2}
            placeholder="What round is it, what format — and what are you most worried they'll ask?"
            className={`mt-1.5 ${field}`}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">The hardest part of this, for you</span>
          <textarea
            value={challenge}
            onChange={(e) => setChallenge(e.target.value)}
            rows={2}
            placeholder="The question you're dreading, nerves, explaining a gap or layoff, interviewing in your second language — whatever it actually is."
            className={`mt-1.5 ${field}`}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">
            Anything you plan to lean on <span className="text-xs font-normal text-ink-faint">(optional)</span>
          </span>
          <textarea value={ammunition} onChange={(e) => setAmmunition(e.target.value)} rows={2} placeholder="Projects, stories, wins you already want to use." className={`mt-1.5 ${field}`} />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">
            Who's interviewing you? <span className="text-xs font-normal text-ink-faint">(optional, powerful)</span>
          </span>
          <textarea
            value={interviewers}
            onChange={(e) => setInterviewers(e.target.value)}
            rows={3}
            placeholder="Names, titles, their LinkedIn 'about', publications — paste anything you know. Stays on your device; used only to calibrate the prep."
            className={`mt-1.5 ${field}`}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink">When is the interview?</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`mt-1.5 ${field}`} />
          </label>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
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
