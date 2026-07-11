# "Talk to Humans" stop spec (Sissi's LinkedIn idea, honesty-feasible form)

Origin: Sissi wanted "authorize LinkedIn → auto-find people in the target field"
for explorers. LinkedIn's API makes that impossible for a product like ours
(connections data is closed to enterprise partners; scraping is litigated ToS
territory). This spec keeps the job — *explorers need humans more than
curricula* — and drops the integration.

## The feature

When `goals.purpose` ∈ {`career_move`, `curious`}, the generated plan includes
**one networking module** ("Talk to people doing the job"), positioned EARLY
(stop 2-ish): explorers should validate the direction with humans before
investing deep hours. It uses the existing module container — concept teaches
informational interviewing, the task produces real artifacts — plus one new
optional field.

## Division of labor (the honesty line)

- **The model writes WORDS**: who to find (2-3 role archetypes personalized to
  the user's background: "your near-future self, 2-3 yrs into the role", "someone
  who made your exact move"), what to ask (outreach drafts + call questions in
  the user's voice, anchored to their real background/gaps), and search QUERY
  STRINGS.
- **Code builds URLS**: LinkedIn public people-search links
  (`linkedin.com/search/results/people/?keywords=<encoded query>`) constructed
  in code from the model's query strings. The model NEVER emits a URL (no
  invented links); the user clicks into their own logged-in LinkedIn and does
  their own searching. No auth, no scraping, no ToS exposure.

## Schema addition (optional, like comprehensionCheck)

Per module: `searchLinks: [{ label, query }]` — rendered in the Try beat as
"Start your search" buttons. Prompt bullet: only for the networking module;
label = who this search finds, query = the LinkedIn keyword string.

## The module's shape (existing container)

- topic: "Talk to two people doing the job"
- concept: informational interviews as evidence-gathering (not favor-asking);
  the 20-minute structure; why practitioners say yes.
- workedExample: one real-shaped outreach message + the reply it earns.
- task: managerRequest reframed as the user's own brief ("You, three months
  from now, need to know: is this field what you think it is?"); givenInputs =
  the search links + the outreach draft below; steps = shortlist 3 → send 2 →
  hold 2 calls; deliverable = outreach drafts + a notes file (the existing Draft
  editor holds both); doneWhen = "two conversations held; your notes answer
  'is the day-to-day what I imagined?'"; timebox parseable ("2-3 hours across
  a week").
- selfCheck criteria: message mentions YOUR specific background (not a template
  smell); you asked about a real workday, not for a job; you wrote down what
  surprised you.
- No `closesGapIndex` (it validates direction rather than closing a knowledge
  gap) — chips fallback handles it.

## Dual value

The two calls double as **plan validation method #2** (expert spot-check): the
explorer verifies the field AND our plan against a real practitioner in the
same 30 minutes.

## Rollout

1. NOW (zero API): mock module in the growth-equity persona (switched to
   purpose=career_move — a consultant exploring the move is the more natural
   story anyway) + Try-beat search-link rendering + schema/prompt additions.
2. AT LIVE-MODEL VALIDATION: confirm the model produces the module only for
   career_move/curious, with personalized archetypes and sane queries.

## Rejected

LinkedIn OAuth/network reading (unavailable + trust-corrosive), third-party
people-data providers (privacy-creepy for consumers, wrong trust posture),
auto-sent messages (never — the user sends everything themselves).
