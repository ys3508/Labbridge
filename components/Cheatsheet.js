function textOf(value) {
  if (typeof value === "string") return value;
  return value?.text || value?.claim || value?.title || value?.question || "";
}

function questionTitle(question, index) {
  if (typeof question === "string") return question;
  return question?.title || question?.question || question?.prompt || `Question ${index + 1}`;
}

function taskIndexOf(item) {
  const value = item?.taskIndex ?? item?.task_index ?? item?.questionIndex ?? item?.question_index;
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function sectionsFor(questions = [], notes = [], claims = []) {
  const maxIndex = Math.max(
    questions.length - 1,
    ...notes.map(taskIndexOf).filter((i) => i != null),
    ...claims.map(taskIndexOf).filter((i) => i != null),
    0
  );
  return Array.from({ length: maxIndex + 1 }, (_, index) => ({
    index,
    title: questionTitle(questions[index], index),
    notes: notes.filter((note) => taskIndexOf(note) === index),
    claims: claims.filter((claim) => taskIndexOf(claim) === index),
  }));
}

function markdownFor(sections) {
  const lines = ["# Drill Cheatsheet", ""];
  sections.forEach((section) => {
    lines.push(`## ${section.title}`, "");
    const items = [...section.notes.map(textOf), ...section.claims.map(textOf)].map((item) => item.trim()).filter(Boolean);
    if (!items.length) {
      lines.push("Nothing banked here yet.", "");
      return;
    }
    items.forEach((item) => lines.push(`- ${item}`));
    lines.push("");
  });
  return lines.join("\n").trim();
}

export default function Cheatsheet({ questions = [], notes = [], claims = [] }) {
  const sections = sectionsFor(questions, notes, claims);
  const markdown = markdownFor(sections);
  const href = `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`;

  return (
    <section className="space-y-4" aria-label="Drill cheatsheet">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-950">Cheatsheet</h2>
        <a className="text-xs font-semibold text-slate-700 underline underline-offset-4" href={href} download="drill-cheatsheet.md">
          Export Markdown
        </a>
      </div>
      <div className="space-y-4">
        {sections.map((section) => {
          const items = [...section.notes.map(textOf), ...section.claims.map(textOf)].map((item) => item.trim()).filter(Boolean);
          return (
            <section key={section.index} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{section.title}</h3>
              {items.length ? (
                <ul className="space-y-1.5 text-sm text-slate-800">
                  {items.map((item, itemIndex) => (
                    <li key={`${section.index}-${itemIndex}`} className="leading-6">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Nothing banked here yet.</p>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}

export { markdownFor as buildCheatsheetMarkdown };
