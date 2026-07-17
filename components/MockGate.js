"use client";

// Sample-plan mode: when enabled, intercepts every /api/* request and returns
// canned data from lib/mockResponses.js so the whole demo runs with zero API.
// Enable by visiting `?mock=1` or the sample-plan link; leave with `?mock=0`.

import { useEffect, useState } from "react";
import { resolveMock } from "@/lib/mockResponses";

function safeParse(body) {
  try {
    return typeof body === "string" ? JSON.parse(body) : null;
  } catch {
    return null;
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PERSONAS = ["rwe", "growth", "interview"];
const PERSONA_LABELS = {
  rwe: "RWE analyst",
  growth: "growth equity",
  interview: "interview prep",
};

export default function MockGate() {
  const [on, setOn] = useState(false);
  const [persona, setPersona] = useState("rwe");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("mock");
    if (q === "1") localStorage.setItem("lb_mock", "1");
    if (q === "0") localStorage.removeItem("lb_mock");
    // Demo personas — switchable from the banner.
    const p = params.get("persona");
    if (p) localStorage.setItem("lb_persona", PERSONAS.includes(p) ? p : "rwe");
    setPersona(PERSONAS.includes(localStorage.getItem("lb_persona")) ? localStorage.getItem("lb_persona") : "rwe");

    const enabled = localStorage.getItem("lb_mock") === "1";
    setOn(enabled);
    if (!enabled || window.__lbMockPatched) return;

    // Patch fetch once. Any /api/* we have a mock for is served locally with a
    // small delay so async UI states still show; everything else passes through.
    window.__lbMockPatched = true;
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input?.url || "";
      if (url.includes("/api/")) {
        const data = resolveMock(url, safeParse(init?.body));
        if (data !== undefined) {
          await wait(url.includes("/api/plan") ? 900 : 300);
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      return realFetch(input, init);
    };
  }, []);

  if (!on) return null;
  const nextPersona = PERSONAS[(PERSONAS.indexOf(persona) + 1) % PERSONAS.length] || "rwe";
  return (
    <div className="fixed bottom-3 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 shadow-sm">
      Sample plan ({PERSONA_LABELS[persona] || "RWE analyst"}) — explore freely ·{" "}
      <a href={`/?mock=1&persona=${nextPersona}`} className="underline">
        switch sample
      </a>{" "}
      ·{" "}
      <a href="/?mock=0" className="underline">
        exit sample
      </a>
    </div>
  );
}
