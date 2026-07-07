"use client";

import { Section, OptionCard, Note } from "./ui";
import { DEPTH_OPTIONS, PURPOSE_OPTIONS } from "@/lib/constants";

export default function GoalsSection({ value, onChange, inferredPurpose }) {
  const set = (patch) => onChange({ ...value, ...patch });

  const showInferNote = inferredPurpose && !value.purposeTouched && value.purpose === inferredPurpose;
  const inferredLabel = PURPOSE_OPTIONS.find((p) => p.key === inferredPurpose)?.label;

  return (
    <Section
      number={3}
      title="Your goals"
      subtitle="Two quick taps — plain outcomes, no jargon."
    >
      {showInferNote && (
        <div className="mb-5">
          <Note>
            From your materials it looks like you're <strong>{inferredLabel?.toLowerCase()}</strong>. We
            pre-filled that below — change it if we read you wrong.
          </Note>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Where do you want to land?</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {DEPTH_OPTIONS.map((d) => (
            <OptionCard
              key={d.key}
              label={d.label}
              hint={d.hint}
              selected={value.depth === d.key}
              onClick={() => set({ depth: d.key })}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-ink">What's driving this?</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PURPOSE_OPTIONS.map((p) => (
            <OptionCard
              key={p.key}
              label={p.label}
              hint={p.hint}
              selected={value.purpose === p.key}
              onClick={() => set({ purpose: p.key, purposeTouched: true })}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
