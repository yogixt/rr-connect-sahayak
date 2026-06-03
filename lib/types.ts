export type LangCode = "hi" | "en";

export interface Language {
  code: LangCode;
  name: string;
  native: string;
}

export interface OptionAction {
  type: "call" | "pincode";
  value?: string;
}

export interface ChatOption {
  id: string;
  icon: string;
  label: string;
  action?: OptionAction;
}

export interface ChatNode {
  node_id: string;
  kind: "menu" | "info" | "end";
  icon: string;
  text: string;
  options: ChatOption[];
}

export interface ChatState {
  session_id: string;
  language: LangCode;
  node: ChatNode;
}
