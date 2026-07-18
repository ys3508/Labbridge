# Drill cost probe — 2026-07-18

**Scope:** measurement only. No speak-runner build. One drill loop = **two takes + one push + one grade/feedback + one condense-tap**. Browser Web Speech is v1 STT, so transcription is priced at **$0** here.

**Model:** `claude-haiku-4-5` from `lib/ai.js`.

**Pricing used:** Anthropic public pricing, 2026-07-18: Haiku 4.5 = **$1 / MTok input** and **$5 / MTok output** ([source](https://claude.com/pricing)). That is 0.0001 cents/input token and 0.0005 cents/output token.

**Probe method:** `scripts/drill-cost-probe.mjs` ran real Anthropic calls against a realistic interview drill: a lower-middle-market M&A Associate JD, a Q2-style quality-of-earnings question, resume + diagnostic context, and short / typical / long spoken-answer transcripts. The script reads the actual `app/api/coach/route.js` and `app/api/assist/route.js` system prompt constants, then measures the three paid planned steps:

1. Push generation, using the coach route's system prompt shape.
2. Grade/feedback, using the coach route's structured review shape.
3. Tap-to-notes condense, using the interview assistant / dig prompt context.

The push and condense endpoints are not built yet, so this prices the planned route extensions using the current route prompts and realistic loop context, not shipped UI behavior.

## Results

| answer length | paid call | model | input tokens | output tokens | cost (¢) |
|---|---|---:|---:|---:|---:|
| short, 55-word take | push generation | `claude-haiku-4-5` | 1,174 | 113 | 0.1739 |
| short, 55-word take | grade / feedback | `claude-haiku-4-5` | 1,581 | 529 | 0.4226 |
| short, 55-word take | condense tap | `claude-haiku-4-5` | 1,459 | 43 | 0.1674 |
| **short total** |  |  | **4,214** | **685** | **0.7639** |
| typical, 135-word take | push generation | `claude-haiku-4-5` | 1,268 | 95 | 0.1743 |
| typical, 135-word take | grade / feedback | `claude-haiku-4-5` | 1,804 | 555 | 0.4579 |
| typical, 135-word take | condense tap | `claude-haiku-4-5` | 1,494 | 60 | 0.1794 |
| **typical total** |  |  | **4,566** | **710** | **0.8116** |
| long, 260-word take | push generation | `claude-haiku-4-5` | 1,413 | 112 | 0.1973 |
| long, 260-word take | grade / feedback | `claude-haiku-4-5` | 2,142 | 493 | 0.4607 |
| long, 260-word take | condense tap | `claude-haiku-4-5` | 1,542 | 71 | 0.1897 |
| **long total** |  |  | **5,097** | **676** | **0.8477** |

## Range

- Full-loop low: **0.7639¢**
- Full-loop typical: **0.8116¢**
- Full-loop high: **0.8477¢**
- Spread: **0.0838¢**

At this measured range, 8 drills would cost roughly **6.1¢-6.8¢** in paid model calls, before any later overhead from orchestration or extra user-triggered dig chats.

## Read

The data supports **bundle, not meter**.

Variance is tiny: the long-answer loop costs only **0.0838¢** more than the short-answer loop. Grade/feedback is the dominant call, but even there the cost stays under half a cent per loop. A live meter would make the practice loop feel expensive and monitored while saving almost nothing; the product wants repetition under pressure, so the UI should avoid taxing every retake with a visible per-drill meter.

Best current posture: state an aggregate once before paid practice, then let the drill loop feel free while the user is inside it. Reopen only if the actual Session B implementation adds a materially larger step, switches away from Haiku, or replaces browser Web Speech with paid STT.
