import type { JSX } from "react";

// Matches a toll-free number ("1800 103 6633") or a 10-digit mobile ("6358292482").
const PHONE = /(1800\s?\d{3}\s?\d{3,4}|[6-9]\d{9})/g;

type Node = JSX.Element | string;

/** Turn phone numbers in a plain run of text into underlined tel: links. */
function linkifyPhones(text: string, kp: string): Node[] {
  const out: Node[] = [];
  let last = 0;
  let i = 0;
  PHONE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PHONE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const digits = m[0].replace(/\D/g, "");
    out.push(
      <a
        key={`${kp}-p${i++}`}
        href={`tel:${digits}`}
        className="font-bold text-red-600 underline underline-offset-2"
      >
        {m[0]}
      </a>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Render inline **bold** segments and tappable phone numbers within a line. */
function inline(text: string, kp: string): Node[] {
  return text.split(/\*\*(.+?)\*\*/g).flatMap((part, i) =>
    i % 2 === 1
      ? [
          <strong key={`${kp}-b${i}`} className="font-bold text-stone-900">
            {part}
          </strong>,
        ]
      : linkifyPhones(part, `${kp}-t${i}`),
  );
}

/**
 * Light renderer for the bot's simple markup:
 *   - "1. ..."  -> a numbered step with a badge
 *   - "- ..."   -> a bullet point
 *   - **bold**  -> bold
 *   - phone numbers -> underlined tap-to-call links
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
              <span className="pt-0.5 text-lg leading-snug text-stone-800">
                {inline(step[2], `l${i}`)}
              </span>
            </div>
          );
        }

        const bullet = trimmed.match(/^[-•]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={i} className="flex items-start gap-2.5">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              <span className="text-lg leading-snug text-stone-800">{inline(bullet[1], `l${i}`)}</span>
            </div>
          );
        }

        return (
          <p key={i} className="text-lg leading-relaxed text-stone-800">
            {inline(line, `l${i}`)}
          </p>
        );
      })}
    </div>
  );
}
