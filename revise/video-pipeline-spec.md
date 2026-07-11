# Video Pipeline spec — AI-found, verified, honestly-ranked tutorials (API day)

Origin: Sissi's question "how to use AI to find great videos?" after her first
hand-verified embed (AbbVie, "What is Real-World Evidence?") shipped 2026-07-11.
Design principle unchanged from every other resource kind: **the model writes
queries and judges fit; APIs provide candidates; verification gates everything;
the model never authors a video.**

## Prerequisites

- A **YouTube Data API v3 key** (free, Google Cloud console, ~10k units/day —
  search costs 100 units ⇒ ~100 searches/day free). Sissi creates it (5 min);
  lives in `.env.local` as `YOUTUBE_API_KEY`, server-side only, like the
  Anthropic key.
- Anthropic balance for the Haiku judge (stage 3) — cents per plan.

## The four stages

### 1. Candidate generation (model → queries only)
- In `/api/candidates` (or a sibling `/api/video-candidates`), MODEL (Haiku)
  writes 2–3 search query strings per module, from topic + concept + learner
  background — the `searchLinks` pattern: **query strings only, never URLs**.
- Code calls Data API `search.list` (type=video, safeSearch=strict,
  relevanceLanguage from locale) → top ~8 per query.

### 2. Verification (code, zero AI)
- Data API `videos.list` for status + statistics + contentDetails; drop any
  candidate that is: not embeddable, private/region-blocked, age-restricted,
  a live stream, or > 45 min (module-unfittable).
- oEmbed as the final existence check (same call as the manual flow) — its
  title/channel are what the UI displays, verbatim.

### 3. "Greatness" scoring (hard signals + model-as-judge)
- **Hard pre-rank in code** (no AI): duration fit (5–25 min sweet spot for a
  moment), view count (log-scaled), like ratio where available, caption
  availability (accessibility + educator-seriousness proxy), recency for
  fast-moving fields.
- **Haiku fit-judge** on the top ~5 per module: given the module's task,
  concept, and learner level + each candidate's title/description/channel/
  duration → score relevance and level-fit; flag channel-authority judgment
  ("official org / known educator / unknown"). The judge RANKS; it cannot add.
- **Explicitly rejected:** transcript scraping to "watch" videos (third-party
  caption pulling is ToS-gray; metadata is enough signal for a 0-or-1 pick).

### 4. Selection (0 or 1 per module, honest empty)
- Same contract as `/api/select`: pick at most ONE video per module, by index
  from the verified pool, with a `use` note ("watch once before the memo task —
  orientation, nothing more"). Picking none is good. UI shows channel + duration
  so the user judges too; embed stays the sanctioned nocookie player.

## The curation tier (beats the pipeline, feeds it)

A verified great video is REUSABLE — "what is RWE?" doesn't change per user.
Maintain a per-field **curated pool** (started 2026-07-11 with Sissi's AbbVie
find): human-verified entries rank ABOVE pipeline finds and are consulted
before any search runs. Sissi's googling is seed data, not a stopgap. Curated
entries live in a small JSON (topic tags → verified video records) checked by
the same oEmbed gate at load.

## Schema / UI touches

- Resource records already support `kind: "video"` + the nocookie embed player
  (shipped). Add `by` (channel) and `duration` display.
- No plan-schema change needed — videos flow through the existing
  candidates → select pipeline shape.

## Cost model

Per plan: ~4 searches (free quota) + 1–2 Haiku judge calls (~fractions of a
cent) + oEmbed (free). Negligible next to the Opus plan generation.

## Acceptance criteria (API day)

1. RWE fixture run: each module gets 0–1 video; every shown video is
   oEmbed-verified, embeddable, ≤ 45 min; title/channel verbatim from the API.
2. The curated AbbVie entry outranks pipeline candidates for the orientation
   topic (curation tier works).
3. A module where nothing fits shows no video (honest empty verified live).
4. Kill the key → video stage skips silently; plans generate unchanged
   (graceful degradation, like WEB_AUGMENT).
5. No model-authored URL anywhere in the flow (grep the diff for youtube.com
   literals outside code-built embeds).

## Rejected on the record

Model-remembered video links (hallucination class) · transcript scraping ·
re-hosting/downloading · auto-playing embeds (immersion killer) · more than one
video per module (it's a course of DOING; video is seasoning).
