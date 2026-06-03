import { create } from "zustand";
import * as api from "./api";
import type { ChatNode, ChatOption, Language, LangCode } from "./types";

export interface Message {
  id: string;
  role: "bot" | "user";
  text: string;
  icon?: string;
  options?: ChatOption[];
}

interface ChatStore {
  languages: Language[];
  language: LangCode | null;
  sessionId: string | null;
  messages: Message[];
  busy: boolean;
  error: string | null;
  pincodeOpen: boolean;

  loadLanguages: () => Promise<void>;
  begin: (language: LangCode) => Promise<void>;
  choose: (option: ChatOption) => Promise<void>;
  switchLanguage: (language: LangCode) => Promise<void>;
  submitPincode: (pincode: string) => Promise<void>;
  closePincode: () => void;
  reset: () => void;
}

let seq = 0;
const nextId = () => `m${++seq}`;

function botMessage(node: ChatNode): Message {
  return {
    id: nextId(),
    role: "bot",
    text: node.text,
    icon: node.icon,
    options: node.options,
  };
}

export const useChat = create<ChatStore>((set, get) => ({
  languages: [],
  language: null,
  sessionId: null,
  messages: [],
  busy: false,
  error: null,
  pincodeOpen: false,

  async loadLanguages() {
    try {
      const { languages } = await api.getLanguages();
      set({ languages });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  async begin(language) {
    set({ busy: true, error: null, language });
    try {
      const state = await api.startChat(language);
      set({
        sessionId: state.session_id,
        language: state.language,
        messages: [botMessage(state.node)],
      });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ busy: false });
    }
  },

  async choose(option) {
    const { sessionId, language, busy } = get();
    if (!sessionId || !language || busy) return;

    // A "call" option dials out — it isn't a flow transition.
    if (option.action?.type === "call") {
      window.location.href = `tel:${option.action.value}`;
      return;
    }

    // A "pincode" option opens the on-screen number pad.
    if (option.action?.type === "pincode") {
      set({ pincodeOpen: true });
      return;
    }

    // Echo the user's choice, then disable options on prior bot turns.
    set((s) => ({
      busy: true,
      error: null,
      messages: [
        ...s.messages.map((m) => (m.role === "bot" ? { ...m, options: undefined } : m)),
        { id: nextId(), role: "user", text: option.label, icon: option.icon },
      ],
    }));

    try {
      const state = await api.selectOption(sessionId, option.id, language);
      set((s) => ({ messages: [...s.messages, botMessage(state.node)] }));
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ busy: false });
    }
  },

  async switchLanguage(language) {
    const { sessionId } = get();
    set({ language });
    if (!sessionId) return;
    // Re-render the current node in the new language as a fresh turn.
    try {
      const state = await api.resumeSession(sessionId, language);
      set((s) => ({
        messages: [
          ...s.messages.map((m) => (m.role === "bot" ? { ...m, options: undefined } : m)),
          botMessage(state.node),
        ],
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  async submitPincode(pincode) {
    const { sessionId } = get();
    if (!sessionId) return;
    set((s) => ({
      pincodeOpen: false,
      busy: true,
      error: null,
      messages: [
        ...s.messages.map((m) => (m.role === "bot" ? { ...m, options: undefined } : m)),
        { id: nextId(), role: "user", text: pincode, icon: "location" },
      ],
    }));
    try {
      const state = await api.submitPincode(sessionId, pincode);
      set((s) => ({ messages: [...s.messages, botMessage(state.node)] }));
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ busy: false });
    }
  },

  closePincode() {
    set({ pincodeOpen: false });
  },

  reset() {
    set({
      sessionId: null,
      messages: [],
      language: null,
      error: null,
      busy: false,
      pincodeOpen: false,
    });
  },
}));
