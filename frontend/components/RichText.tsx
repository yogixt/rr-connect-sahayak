import type { JSX } from "react";

/** Render inline **bold** segments within a line. */
function inline(text: string): JSX.Element[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-bold text-stone-900">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/**
 * Light renderer for the bot's simple markup:
 *   - "1. ..."  -> a numbered step with a badge
 *   - "- ..."   -> a bullet point
 *   - **bold**  -> bold
 * Blank lines become spacing. Nothing else is interpreted (no HTML).
 */
export default function RichText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed === "") return <div key={i} className="h-1.5" />;

        const step = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (step) {
          return (
            <div key={i} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
                {step[1]}
              </span>
              <span className="pt-0.5 text-lg leading-snug text-stone-800">{inline(step[2])}</span>
            </div>
          );
        }

        const bullet = trimmed.match(/^[-•]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={i} className="flex items-start gap-2.5">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              <span className="text-lg leading-snug text-stone-800">{inline(bullet[1])}</span>
            </div>
          );
        }

        return (
          <p key={i} className="text-lg leading-relaxed text-stone-800">
            {inline(line)}
          </p>
        );
      })}
    </div>
  );
}
