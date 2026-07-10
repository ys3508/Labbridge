# Artifact Experience mini-spec — per-file downloads + last-edited (Claude → Codex)

Agreed with Sissi 2026-07-10. Two small BEHAVIOR additions that must land BEFORE
the zero-behavior `layout-foundation-spec.md`.

⚠️ **Sequencing:** after `completion-rewards-spec.md` is done and reviewed, before
`layout-foundation-spec.md`. (Slight overlap with rewards item D on the export
button — this spec does NOT touch the project export.)

## The principle

Sissi's phrase was "fake downloadable file cards" — we build the REAL version
instead, because it costs the same and our honesty rules forbid fake: each file
card downloads the user's actual draft. Same for timestamps: client-recorded at
real edits, never invented. (The date-fidelity rule bans the *model* inventing
dates; the app recording when the user typed is honest data.)

---

## 1. Per-file download (real, zero API)

- In the **file preview** (the panel opened by clicking a file), add a small
  download link when the draft is non-empty:
  - `href` = `data:text/markdown;charset=utf-8,...` of that file's draft ONLY
    (plus a one-line `# {deliverableName}` header).
  - `download` = `{deliverableName}.md` (it already looks like `01_a_one_page_memo…`).
- No draft → no per-file link (we don't ship empty files); the honest empty-state
  message stays as is. The whole-project export (with its `_Not written yet._`
  placeholders) is unchanged and remains the completionist path.

## 2. "Last edited" labels

- New persisted store, same pattern as the others:
  `lb_draftmeta_<planKey>` → `{ [taskIndex]: epochMs }`, updated whenever that
  task's draft text changes (piggyback on the existing draft-save path; a
  trailing debounce is fine).
- Display, derived live from the store:
  - File card status line gains ` · edited {short date}` (e.g. "edited Jul 10")
    when a timestamp exists — appended to the existing artifact-state line.
  - File preview header shows the fuller form: "Last edited {date, time}".
- Rules: timestamp records only real edits (including edits that empty the
  draft — that was still an edit); never rendered when no edit ever happened;
  format via `toLocaleDateString`/`toLocaleTimeString` (user's locale), no
  relative-time math ("2h ago") — it goes stale and lies.

## Non-goals
No file-card visual redesign (visual pass), no per-file PDF (markdown only), no
touch to the project export button (rewards item D owns it), no new API calls.

---

## Acceptance criteria (verify in `?mock=1`, zero API)

1. Write a draft in Task 1 → its preview shows a download link; the decoded
   `data:` href contains the draft verbatim under a `# {filename}` header;
   `download` attr = `{filename}.md`; no network request fires.
2. Task with no draft → no per-file link; empty-state message unchanged.
3. After the edit, the file card shows " · edited {today's short date}" and the
   preview shows date+time; both survive a refresh.
4. A file never edited shows no edited label anywhere.
5. Edit the draft again → timestamp updates (live, no refresh needed).
6. Project export behavior byte-identical to before this spec.
7. No console errors; state keyed by `planKey` like all the rest.
