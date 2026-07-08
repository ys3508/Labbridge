// SERVER-ONLY. Do not import from client components — this reads the API key
// and instantiates the SDK. Route handlers only.
import Anthropic from "@anthropic-ai/sdk";

export const client = new Anthropic();

// One place to change the model. Haiku 4.5 is fast + cheap — a good fit for
// these high-frequency extraction/classification calls. Swap to
// "claude-opus-4-8" or "claude-sonnet-5" here if you want more nuance.
export const MODEL = "claude-haiku-4-5";

// Plan generation runs once per "build my plan" click and is the flagship,
// quality-sensitive call — so it uses the strongest model, not the cheap one.
export const PLAN_MODEL = "claude-opus-4-8";
