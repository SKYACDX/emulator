// Minimal markdown subset: paragraphs, "**bold**", and "- " bullet lines.
// No library — the app's description only ever uses these three things.
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={`${keyPrefix}-${i}`}>{part}</strong> : part
  );
}

export default function AppDescription({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\n+/);

  return (
    <div className="flex flex-col gap-3 text-sm text-muted">
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter(Boolean);
        const isList = lines.every((line) => line.trim().startsWith("- "));

        if (isList) {
          return (
            <ul key={i} className="list-disc pl-5">
              {lines.map((line, j) => (
                <li key={j}>{renderInline(line.replace(/^- /, ""), `${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="whitespace-pre-wrap">
            {renderInline(block, `${i}`)}
          </p>
        );
      })}
    </div>
  );
}
