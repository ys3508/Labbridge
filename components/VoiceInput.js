"use client";

import { useEffect, useRef, useState } from "react";

const FILLERS = /\b(um+|uh+|erm+|like|you know|i mean|sort of|kind of)\b/gi;
const FALSE_STARTS = /\b(sorry|let me start|let me restart|wait|actually)\b/gi;

function words(text) {
  const latin = text.toLowerCase().match(/[a-z0-9]+(?:['-][a-z0-9]+)?/gi) || [];
  const cjk = text.match(/[\u3400-\u9fff]/g) || [];
  return latin.length + Math.ceil(cjk.length / 2);
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

function computeMetrics({ text, startedAt, endedAt, takeNumber, longPauseCount, mode }) {
  const wordCount = words(text);
  if (mode === "typed") {
    return {
      mode,
      takeNumber,
      durationSec: null,
      wordCount,
      wordsPerMinute: null,
      fillerCount: countMatches(text, FILLERS),
      longPauseCount: null,
      falseStartCount: countMatches(text, FALSE_STARTS),
      pacingMeasured: false,
    };
  }
  const durationSec = Math.max(1, Math.round((endedAt - startedAt) / 1000));
  return {
    mode,
    takeNumber,
    durationSec,
    wordCount,
    wordsPerMinute: Math.round((wordCount / durationSec) * 60),
    fillerCount: countMatches(text, FILLERS),
    longPauseCount,
    falseStartCount: countMatches(text, FALSE_STARTS),
    pacingMeasured: true,
  };
}

function metricsLine(metrics) {
  if (!metrics) return "";
  if (metrics.mode === "typed") {
    return [
      "input=typed",
      "pacing=not_measured",
      `words=${metrics.wordCount}`,
      `fillers=${metrics.fillerCount}`,
      `false_starts=${metrics.falseStartCount}`,
    ].join("; ");
  }
  return [
    `input=${metrics.mode}`,
    `take=${metrics.takeNumber}`,
    `duration=${metrics.durationSec}s`,
    `words=${metrics.wordCount}`,
    `wpm=${metrics.wordsPerMinute}`,
    `fillers=${metrics.fillerCount}`,
    `long_pauses=${metrics.longPauseCount}`,
    `false_starts=${metrics.falseStartCount}`,
  ].join("; ");
}

function SpeechCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function formatDeliveryMetrics(metrics, takes = [], { includeHistory = true } = {}) {
  const current = metricsLine(metrics);
  const history = includeHistory ? takes
    .slice(-3)
    .map((take) => metricsLine(take.metrics))
    .filter(Boolean) : [];
  return [current && `Current answer: ${current}`, history.length && `Earlier takes kept as coaching signal:\n${history.join("\n")}`]
    .filter(Boolean)
    .join("\n");
}

export default function VoiceInput({ value, onChange, onMetricsChange, onSkipQuestion, tone }) {
  const [supported, setSupported] = useState(null);
  const [mode, setMode] = useState(tone === "gentle" ? "type" : "voice");
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [takes, setTakes] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [nudge, setNudge] = useState("");
  const [retakeNote, setRetakeNote] = useState(false);
  const [unavailableReason, setUnavailableReason] = useState("");
  const recognitionRef = useRef(null);
  const transcriptRef = useRef(value || "");
  const listeningRef = useRef(false);
  const startedAtRef = useRef(0);
  const lastSpeechAtRef = useRef(0);
  const pauseCountRef = useRef(0);
  const pauseArmedRef = useRef(true);

  useEffect(() => {
    const ok = Boolean(SpeechCtor());
    setSupported(ok);
    if (!ok) {
      setMode("type");
      setUnavailableReason("Voice is not available in this browser. Typed is the same diagnostic, minus delivery timing.");
    }
  }, []);

  useEffect(() => {
    transcriptRef.current = value || "";
  }, [value]);

  useEffect(() => {
    onMetricsChange?.({ metrics, takes });
  }, [metrics, takes, onMetricsChange]);

  useEffect(() => {
    if (!listening) return undefined;
    const id = window.setInterval(() => {
      const now = Date.now();
      const silentFor = now - lastSpeechAtRef.current;
      const noWordsYet = !words(transcriptRef.current) && !interim.trim();
      if (silentFor > 6000 && pauseArmedRef.current) {
        pauseCountRef.current += 1;
        pauseArmedRef.current = false;
      }
      if (silentFor <= 1500) pauseArmedRef.current = true;
      if (noWordsYet && silentFor > (tone === "gentle" ? 6000 : 8000) && silentFor < 19000) {
        setNudge(tone === "gentle" ? "Take your time. One plain sentence is enough." : "Take your time. One sentence is a fine start.");
      } else if (noWordsYet && silentFor >= 19000) {
        setNudge(
          onSkipQuestion
            ? "You can use the starter phrase, switch to typing, or skip this one."
            : "You can use the starter phrase or switch to typing."
        );
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [interim, listening, onSkipQuestion, tone]);

  const stop = () => {
    recognitionRef.current?.stop?.();
    setListening(false);
    listeningRef.current = false;
    setInterim("");
    setNudge("");
    const endedAt = Date.now();
    const nextMetrics = computeMetrics({
      text: transcriptRef.current,
      startedAt: startedAtRef.current || endedAt,
      endedAt,
      takeNumber: takes.length + 1,
      longPauseCount: pauseCountRef.current,
      mode: "voice",
    });
    const nextTake = { transcript: transcriptRef.current, metrics: nextMetrics };
    setMetrics(nextMetrics);
    setTakes((prev) => [...prev, nextTake]);
  };

  const markVoiceUnavailable = (reason = "Voice was not available here. Typed is fine.") => {
    if (recognitionRef.current) {
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.abort?.();
    }
    setSupported(false);
    setListening(false);
    listeningRef.current = false;
    setMode("type");
    setInterim("");
    setNudge("");
    setUnavailableReason(reason);
  };

  const start = () => {
    const Ctor = SpeechCtor();
    if (!Ctor) {
      markVoiceUnavailable("Voice is not available in this browser. Typed is the same diagnostic, minus delivery timing.");
      return;
    }
    if (takes.length > 0) setRetakeNote(true);
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) finalText += piece;
        else interimText += piece;
      }
      if (finalText.trim()) {
        const next = `${transcriptRef.current} ${finalText}`.replace(/\s+/g, " ").trim();
        transcriptRef.current = next;
        onChange(next);
        lastSpeechAtRef.current = Date.now();
        pauseArmedRef.current = true;
      }
      setInterim(interimText.trim());
    };
    recognition.onerror = (event) => {
      if (event?.error === "no-speech") {
        setListening(false);
        listeningRef.current = false;
        setNudge(tone === "gentle" ? "Take your time. One plain sentence is enough." : "Take your time. One sentence is a fine start.");
        return;
      }
      markVoiceUnavailable("Voice could not start in this browser. Open this page in Chrome or Edge to test the mic, or type here.");
    };
    recognition.onend = () => {
      if (listeningRef.current) {
        setListening(false);
        listeningRef.current = false;
      }
    };
    recognitionRef.current = recognition;
    startedAtRef.current = Date.now();
    lastSpeechAtRef.current = Date.now();
    pauseCountRef.current = 0;
    pauseArmedRef.current = true;
    setInterim("");
    setNudge("");
    setListening(true);
    listeningRef.current = true;
    try {
      recognition.start();
    } catch {
      markVoiceUnavailable("Voice could not start in this browser. Open this page in Chrome or Edge to test the mic, or type here.");
    }
  };

  const switchMode = (nextMode) => {
    if (nextMode === "voice" && supported === false) return;
    if (listening) stop();
    setMode(nextMode);
    if (nextMode === "type" && value.trim()) {
      const nextMetrics = computeMetrics({
        text: value,
        takeNumber: takes.length || 1,
        longPauseCount: 0,
        mode: "typed",
      });
      setMetrics(nextMetrics);
    }
  };

  const updateTyped = (text) => {
    onChange(text);
    transcriptRef.current = text;
    setMetrics(
      computeMetrics({
        text,
        takeNumber: takes.length || 1,
        longPauseCount: 0,
        mode: "typed",
      })
    );
  };

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => switchMode("voice")}
            disabled={supported === false}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${mode === "voice" ? "bg-white text-ink shadow-sm" : "text-ink-soft"} disabled:opacity-40`}
          >
            Voice
          </button>
          <button
            type="button"
            onClick={() => switchMode("type")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${mode === "type" ? "bg-white text-ink shadow-sm" : "text-ink-soft"}`}
          >
            Type
          </button>
        </div>
        {mode === "voice" && (
          <p className="text-xs text-ink-faint">Voice uses your browser's speech service to transcribe; we never store audio.</p>
        )}
      </div>

      {supported === false && (
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          {unavailableReason || "Voice is not available in this browser. Typed is the same diagnostic, minus delivery timing."}
        </p>
      )}

      {mode === "voice" ? (
        <div className="mt-3">
          <p className="mb-2 text-xs leading-relaxed text-ink-soft">
            Say it out loud when you're ready. Rough is fine.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={listening ? stop : start}
              className={`rounded-lg px-4 py-2 text-xs font-semibold text-white ${listening ? "bg-rose-600 hover:bg-rose-700" : "bg-brand-500 hover:bg-brand-600"}`}
            >
              {listening ? "Stop and confirm transcript" : value.trim() ? "Try that again" : "Start speaking"}
            </button>
            {takes.length > 0 && !listening && (
              <span className="text-xs text-ink-faint">
                {takes.length} take{takes.length === 1 ? "" : "s"} kept as coaching signal.
              </span>
            )}
          </div>
          {nudge && (
            <div className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs leading-relaxed text-ink-soft">
              {nudge}{" "}
              <button type="button" onClick={() => updateTyped("I've spent the last few years ")} className="font-semibold text-brand-700 underline underline-offset-2">
                Use a starter phrase
              </button>{" "}
              or{" "}
              <button type="button" onClick={() => switchMode("type")} className="font-semibold text-brand-700 underline underline-offset-2">
                switch to typing
              </button>
              {onSkipQuestion && (
                <>
                  {" "}
                  or{" "}
                  <button type="button" onClick={onSkipQuestion} className="font-semibold text-brand-700 underline underline-offset-2">
                    skip this one
                  </button>
                </>
              )}
              .
            </div>
          )}
          {retakeNote && (
            <p className="mt-2 text-xs leading-relaxed text-ink-faint">
              I keep earlier take transcripts and metrics for this session only; they show where pressure bites. Audio is discarded.
            </p>
          )}
          <label className="mt-3 block">
            <span className="text-xs font-medium text-ink-soft">Here's what I heard — fix anything before grading.</span>
            <textarea
              value={[value, interim].filter(Boolean).join(interim ? " " : "")}
              onChange={(e) => updateTyped(e.target.value)}
              rows={4}
              placeholder="Your transcript will appear here. You can also type directly."
              className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 t-body text-ink focus:border-brand-300 focus:outline-none"
            />
          </label>
        </div>
      ) : (
        <label className="mt-3 block">
          <span className="text-xs font-medium text-ink-soft">
            {supported === false
              ? "Type the version you'd say out loud."
              : tone === "gentle" ? "Typed is fine. Voice can come later in the ramp." : "Typed is fine if you're not ready to talk yet."}
          </span>
          <textarea
            value={value}
            onChange={(e) => updateTyped(e.target.value)}
            rows={4}
            placeholder="Answer like it's the real room — typed is fine."
            className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 t-body text-ink focus:border-brand-300 focus:outline-none"
          />
        </label>
      )}

      {metrics && (
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          {metrics.mode === "typed"
            ? `Text signal: ${metrics.wordCount} words, ${metrics.fillerCount} filler${metrics.fillerCount === 1 ? "" : "s"}, ${metrics.falseStartCount} restart cue${metrics.falseStartCount === 1 ? "" : "s"}. Pacing is not measured for typed answers.`
            : `Delivery signal: ${metrics.durationSec}s, ${metrics.wordsPerMinute} wpm, ${metrics.fillerCount} filler${metrics.fillerCount === 1 ? "" : "s"}, ${metrics.longPauseCount} long pause${metrics.longPauseCount === 1 ? "" : "s"}.`}
        </p>
      )}
    </div>
  );
}
