// Client-side flow engine. The bot is fully deterministic and contains no secrets,
// so the whole conversation runs in the browser — no separate backend, no database.
// The single exception is the pincode -> ASM lookup, which calls the /api/asm
// Vercel route so the 39k-row directory stays server-side (not bulk-downloadable).
//
// These functions keep the exact signatures and return shapes the old HTTP client
// had, so the store and components are unchanged.
import type { ChatNode, ChatState, Language, LangCode } from "./types";
import {
  CARE_NUMBER,
  GET_ASM_OPTION,
  LANGUAGE_META,
  LANGUAGES,
  ROLE_SEGMENT,
  START_NODE,
  nodeExists,
  normalizeLang,
  renderNode,
  renderOption,
  resolveOption,
} from "./flow";

interface Session {
  language: LangCode;
  currentNode: string;
  pincode: string | null;
  segment: string | null;
}

// In-memory sessions, keyed by id. State lives only for the open tab, which is all
// a deterministic bot needs — there is nothing to persist between taps.
const sessions = new Map<string, Session>();

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `s-${Math.random().toString(36).slice(2)}`;
}

interface AsmMapping {
  asm_name: string | null;
  asm_phone: string | null;
}

async function lookupAsm(pincode: string, segment: string | null): Promise<AsmMapping | null> {
  try {
    const q = new URLSearchParams({ pincode });
    if (segment) q.set("segment", segment);
    const res = await fetch(`/api/asm?${q.toString()}`);
    if (!res.ok) return null;
    const body = (await res.json()) as { mapping: AsmMapping | null };
    return body.mapping;
  } catch {
    return null;
  }
}

// Mirrors the backend's render_state: personalise the 'Talk to ASM' node with the
// user's area ASM. Three cases — ASM known, pincode but no ASM, or no pincode yet.
async function renderState(session: Session): Promise<ChatNode> {
  const payload = renderNode(session.currentNode, session.language);
  if (session.currentNode !== "talk_asm") return payload;

  const lang = session.language;
  const mapping = session.pincode ? await lookupAsm(session.pincode, session.segment) : null;

  if (mapping && mapping.asm_phone) {
    const name = mapping.asm_name || "ASM";
    const phone = mapping.asm_phone;
    const line: Record<LangCode, string> = {
      hi: `\n\n**आपके इलाके के ASM:**\n${name}\n**फ़ोन नंबर:** ${phone}`,
      en: `\n\n**Your area ASM:**\n${name}\n**Phone number:** ${phone}`,
    };
    payload.text += line[lang] ?? line.en;
  } else if (session.pincode) {
    const line: Record<LangCode, string> = {
      hi: `\n\n**इस पिनकोड के लिए ASM नहीं मिला।**\nकस्टमर केयर: ${CARE_NUMBER}`,
      en: `\n\n**No ASM found for this pincode.**\nCustomer Care: ${CARE_NUMBER}`,
    };
    payload.text += line[lang] ?? line.en;
  } else {
    payload.options = [renderOption(GET_ASM_OPTION, lang), ...payload.options];
  }
  return payload;
}

export async function getLanguages(): Promise<{ languages: Language[] }> {
  return {
    languages: LANGUAGES.map((code) => ({
      code,
      name: LANGUAGE_META[code].name,
      native: LANGUAGE_META[code].native,
    })),
  };
}

export async function startChat(language: LangCode): Promise<ChatState> {
  const lang = normalizeLang(language);
  const id = newId();
  const session: Session = { language: lang, currentNode: START_NODE, pincode: null, segment: null };
  sessions.set(id, session);
  return { session_id: id, language: lang, node: await renderState(session) };
}

export async function selectOption(
  sessionId: string,
  optionId: string,
  language?: LangCode,
): Promise<ChatState> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error("session not found");

  if (language) session.language = normalizeLang(language);

  const option = resolveOption(session.currentNode, optionId);
  // Not an allowed move from the current node — refuse (deterministic guard).
  if (!option) throw new Error("invalid option for current node");

  const next = option.next;
  if (next && nodeExists(next)) session.currentNode = next;

  // The role choice tells us the segment (KD influencer / KC retailer) for ASM lookup.
  if (optionId in ROLE_SEGMENT && !session.segment) session.segment = ROLE_SEGMENT[optionId];

  return { session_id: sessionId, language: session.language, node: await renderState(session) };
}

export async function resumeSession(sessionId: string, language?: LangCode): Promise<ChatState> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error("session not found");
  if (language) session.language = normalizeLang(language);
  return { session_id: sessionId, language: session.language, node: await renderState(session) };
}

export async function submitPincode(sessionId: string, pincode: string): Promise<ChatState> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error("session not found");

  const pin = (pincode.match(/\d/g) || []).join("");
  if (pin.length !== 6) throw new Error("pincode must be 6 digits");

  session.pincode = pin;
  session.currentNode = "talk_asm"; // so the call / menu options stay valid
  return { session_id: sessionId, language: session.language, node: await renderState(session) };
}
