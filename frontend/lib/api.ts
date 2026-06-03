import type { ChatState, Language, LangCode } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* keep statusText */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export function getLanguages(): Promise<{ languages: Language[] }> {
  return request("/languages");
}

export function startChat(language: LangCode, userRef?: string): Promise<ChatState> {
  return request("/chat/start", {
    method: "POST",
    body: JSON.stringify({ language, user_ref: userRef ?? null }),
  });
}

export function selectOption(
  sessionId: string,
  optionId: string,
  language?: LangCode,
): Promise<ChatState> {
  return request("/chat/select", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, option_id: optionId, language }),
  });
}

export function resumeSession(sessionId: string, language?: LangCode): Promise<ChatState> {
  const q = language ? `?language=${language}` : "";
  return request(`/chat/session/${sessionId}${q}`);
}

export function submitPincode(sessionId: string, pincode: string): Promise<ChatState> {
  return request("/chat/pincode", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, pincode }),
  });
}
