// The deterministic conversation flow — the single source of truth.
//
// This is a direct TypeScript port of the backend's seed.py + engine.py so the
// whole bot can run with no separate server. The graph is static and contains no
// secrets; the only thing kept server-side is the pincode -> ASM directory, which
// the /api/asm route serves. To change what the bot says, edit NODES below.
//
// Languages: hi (Hindi) and en (English) only. Missing strings fall back hi -> en.

import type { ChatNode, ChatOption, LangCode, OptionAction } from "./types";

// Official RR Connect customer-care toll-free number (shown as text — the app is an
// embedded webview, so we display numbers rather than trigger a direct dial).
export const CARE_NUMBER = "1800 103 6633";

// The first node every new session starts at (role selection).
export const START_NODE = "start";

// Supported UI languages and the fallback order when a translation is missing.
export const LANGUAGES: LangCode[] = ["hi", "en"];
export const DEFAULT_LANGUAGE: LangCode = "hi";
const FALLBACK: LangCode[] = ["hi", "en"];

// Role option id -> segment in the pincode sheets.
export const ROLE_SEGMENT: Record<string, string> = {
  electrician: "KD",
  retailer: "KC",
};

export const LANGUAGE_META: Record<LangCode, { name: string; native: string }> = {
  hi: { name: "Hindi", native: "हिन्दी" },
  en: { name: "English", native: "English" },
};

type Loc = Partial<Record<LangCode, string>>;

interface RawOption {
  id: string;
  icon?: string;
  label: Loc;
  next?: string;
  action?: OptionAction;
}

interface RawNode {
  kind: ChatNode["kind"];
  icon: string;
  text: Loc;
  options: RawOption[];
}

// ---- Reusable option labels -------------------------------------------------
const L_MAIN: Loc = { hi: "मुख्य मेन्यू", en: "Main Menu" };
const L_BACK: Loc = { hi: "वापस", en: "Back" };
const L_ASM: Loc = { hi: "ASM से बात करें", en: "Talk to ASM" };
const L_EXIT: Loc = { hi: "बंद करें", en: "Exit" };
const L_MORE: Loc = { hi: "और मदद चाहिए", en: "More help" };

// ---- Option builders --------------------------------------------------------
const mainMenu = (): RawOption => ({ id: "main_menu", icon: "home", label: L_MAIN, next: "start" });
const back = (target: string): RawOption => ({ id: "back", icon: "back", label: L_BACK, next: target });
const talkAsm = (): RawOption => ({ id: "talk_asm", icon: "headset", label: L_ASM, next: "talk_asm" });

export const NODES: Record<string, RawNode> = {
  // ===================================================== role / query category
  start: {
    kind: "menu", icon: "wave",
    text: {
      hi: "नमस्ते!\nमैं **RR Connect सहायक** हूँ।\n\nआप कौन हैं?",
      en: "Hello!\nI am **RR Connect Sahayak**.\n\nWho are you?",
    },
    options: [
      { id: "electrician", icon: "wrench", label: { hi: "इलेक्ट्रिशियन", en: "Electrician" }, next: "query_category" },
      { id: "retailer", icon: "store", label: { hi: "रिटेलर", en: "Retailer" }, next: "query_category" },
    ],
  },
  query_category: {
    kind: "menu", icon: "chat",
    text: {
      hi: "आपका सवाल किस बारे में है?",
      en: "What is your question about?",
    },
    options: [
      { id: "wcd", icon: "bolt", label: { hi: "WCD", en: "WCD" }, next: "wcd" },
      { id: "fmeg", icon: "plug", label: { hi: "FMEG", en: "FMEG" }, next: "fmeg_menu" },
      mainMenu(),
    ],
  },

  // ===================================================================== WCD
  wcd: {
    kind: "info", icon: "bolt",
    text: {
      hi: `तार और केबल (WCD) के लिए हमें कॉल करें।\n\n**फ्री नंबर:** ${CARE_NUMBER}`,
      en: `For Wires & Cables (WCD), please call us.\n\n**Free number:** ${CARE_NUMBER}`,
    },
    options: [mainMenu(), { id: "exit", icon: "logout", label: L_EXIT, next: "exit" }],
  },

  // ============================================================ FMEG main menu
  fmeg_menu: {
    kind: "menu", icon: "plug",
    text: {
      hi: "आपको किसमें दिक्कत है?",
      en: "What do you need help with?",
    },
    options: [
      { id: "qr", icon: "qr", label: { hi: "QR स्कैन नहीं हो रहा", en: "Can't scan QR" }, next: "qr1" },
      { id: "redeem", icon: "rupee", label: { hi: "पॉइंट्स रिडीम नहीं हो रहे", en: "Can't redeem points" }, next: "rp1" },
      { id: "kyc", icon: "id-card", label: { hi: "KYC पूरा नहीं हो रहा", en: "Can't complete KYC" }, next: "kyc1" },
      { id: "kyc_wf", icon: "id-card", label: { hi: "KYC अप्रूव नहीं हुआ", en: "KYC not approved" }, next: "kyc_wf1" },
      { id: "scheme", icon: "star", label: { hi: "स्कीम की जानकारी", en: "Scheme info" }, next: "scheme" },
      { id: "address", icon: "location", label: { hi: "पता अपडेट नहीं हो रहा", en: "Can't update address" }, next: "au1" },
      { id: "wrong_role", icon: "user", label: { hi: "गलत भूमिका", en: "Wrong role" }, next: "wrong_role" },
      back("query_category"), mainMenu(),
    ],
  },

  // ========================================================= QR scan flow
  qr1: {
    kind: "menu", icon: "qr",
    text: {
      hi: "स्कैन से पहले यह देखें:\n\n1. क्या आप **FMEG** पेज पर हैं?\n2. क्या फोन की **लोकेशन** चालू है?",
      en: "Check these before scanning:\n\n1. Are you on the **FMEG** page?\n2. Is phone **Location** ON?",
    },
    options: [
      { id: "checked", icon: "checklist", label: { hi: "हाँ, देख लिया", en: "Yes, checked" }, next: "qr2" },
      back("fmeg_menu"), mainMenu(),
    ],
  },
  qr2: {
    kind: "menu", icon: "qr",
    text: {
      hi: "स्क्रीन पर क्या दिक्कत दिख रही है?",
      en: "What problem do you see on the screen?",
    },
    options: [
      { id: "code_missing", icon: "alert", label: { hi: "कोड मौजूद नहीं है", en: "Code does not exist" }, next: "qr_code_missing" },
      { id: "enable_loc", icon: "location", label: { hi: "लोकेशन चालू करनी है", en: "Enable location" }, next: "qr_location" },
      { id: "scanned_other", icon: "alert", label: { hi: "किसी और ने स्कैन किया", en: "Scanned by someone else" }, next: "qr_scanned_other" },
      { id: "scanned_self", icon: "clock", label: { hi: "मैंने पहले स्कैन किया था", en: "I scanned it before" }, next: "qr_scanned_self" },
      back("qr1"), mainMenu(),
    ],
  },
  qr_code_missing: {
    kind: "info", icon: "alert",
    text: {
      hi: "यह कोड स्कैन नहीं हो सकता।\n\nकृपया अपने **ASM** से बात करें।",
      en: "This code cannot be scanned.\n\nPlease talk to your **ASM**.",
    },
    options: [talkAsm(), back("qr2"), mainMenu()],
  },
  qr_location: {
    kind: "info", icon: "location",
    text: {
      hi: "लोकेशन चालू करें:\n\n1. फोन की **सेटिंग** खोलें\n2. **RR Connect** को लोकेशन की अनुमति दें\n3. **लोकेशन** चालू करें\n4. फिर से स्कैन करें",
      en: "Turn on Location:\n\n1. Open phone **Settings**\n2. Allow **RR Connect** to use location\n3. Turn **Location** ON\n4. Scan again",
    },
    options: [
      { id: "try_again", icon: "refresh", label: { hi: "फिर से कोशिश करें", en: "Try Again" }, next: "resolved" },
      back("qr2"), mainMenu(),
    ],
  },
  qr_scanned_other: {
    kind: "info", icon: "alert",
    text: {
      hi: "यह कोड किसी और ने स्कैन कर लिया है।\n\nकृपया अपने **ASM** से बात करें।",
      en: "Someone else has already scanned this code.\n\nPlease talk to your **ASM**.",
    },
    options: [talkAsm(), back("qr2"), mainMenu()],
  },
  qr_scanned_self: {
    kind: "info", icon: "clock",
    text: {
      hi: "शायद आपके पॉइंट्स जुड़ चुके हैं।\n\n1. अपनी **स्कैन हिस्ट्री** देखें\n2. न दिखें तो **24 घंटे** रुकें\n3. फिर भी दिक्कत हो तो **ASM** से बात करें",
      en: "Your points may already be added.\n\n1. Check your **Scan History**\n2. If not shown, wait **24 hours**\n3. Still a problem? Talk to your **ASM**",
    },
    options: [
      { id: "scan_history", icon: "clock", label: { hi: "स्कैन हिस्ट्री देखें", en: "Check Scan History" }, next: "resolved" },
      talkAsm(), back("qr2"), mainMenu(),
    ],
  },

  // ===================================================== redeem points
  rp1: {
    kind: "menu", icon: "rupee",
    text: {
      hi: "रिडीम से पहले यह देखें:\n\n1. कम से कम **300 पॉइंट्स** हों\n2. फोन की **लोकेशन** चालू हो\n3. आपका **KYC** अप्रूव हो",
      en: "Check before redeeming:\n\n1. You need at least **300 points**\n2. Phone **Location** must be ON\n3. Your **KYC** must be approved",
    },
    options: [
      { id: "checked", icon: "checklist", label: { hi: "देख लिया, फिर भी दिक्कत है", en: "Checked, still a problem" }, next: "rp2" },
      back("fmeg_menu"), mainMenu(),
    ],
  },
  rp2: {
    kind: "info", icon: "phone",
    text: {
      hi: `अब भी दिक्कत है?\n\nकस्टमर केयर को कॉल करें।\n\n**नंबर:** ${CARE_NUMBER}`,
      en: `Still a problem?\n\nPlease call Customer Care.\n\n**Number:** ${CARE_NUMBER}`,
    },
    options: [mainMenu()],
  },

  // ===================================================== complete KYC
  kyc1: {
    kind: "menu", icon: "id-card",
    text: {
      hi: "आप अभी कौन से पेज पर हैं?",
      en: "Which page are you on now?",
    },
    options: [
      { id: "on_fmeg", icon: "plug", label: { hi: "मैं FMEG पर हूँ", en: "I am on FMEG" }, next: "kyc2b" },
      { id: "on_wires", icon: "bolt", label: { hi: "मैं Wires पर हूँ", en: "I am on Wires" }, next: "kyc2a" },
      back("fmeg_menu"), mainMenu(),
    ],
  },
  kyc2a: {
    kind: "info", icon: "plug",
    text: {
      hi: "**FMEG** पेज पर जाएँ और फिर से कोशिश करें।\n\nइससे दिक्कत ठीक हो जाएगी।",
      en: "Go to the **FMEG** page and try again.\n\nThis should fix it.",
    },
    options: [
      { id: "go_fmeg", icon: "plug", label: { hi: "FMEG पेज खोलें", en: "Open FMEG page" }, next: "resolved" },
      mainMenu(),
    ],
  },
  kyc2b: {
    kind: "info", icon: "id-card",
    text: {
      hi: "आपका **KYC** अभी अप्रूव नहीं हुआ।\n\n- आप **स्कैन** कर सकते हैं\n- पर **रिडीम** नहीं कर सकते\n\nकृपया अपने **ASM** से बात करें।",
      en: "Your **KYC** is not approved yet.\n\n- You can **scan**\n- But you cannot **redeem**\n\nPlease talk to your **ASM**.",
    },
    options: [
      talkAsm(),
      { id: "still", icon: "alert", label: { hi: "अब भी दिक्कत है", en: "Still a problem" }, next: "kyc3" },
      back("kyc1"), mainMenu(),
    ],
  },
  kyc3: {
    kind: "menu", icon: "location",
    text: {
      hi: "फोन की **लोकेशन** चालू करें।\n\nफिर से कोशिश करें।",
      en: "Turn on phone **Location**.\n\nThen try again.",
    },
    options: [
      { id: "checked", icon: "checklist", label: { hi: "देख लिया, फिर भी दिक्कत है", en: "Checked, still a problem" }, next: "kyc4" },
      back("kyc2b"), mainMenu(),
    ],
  },
  kyc4: {
    kind: "info", icon: "phone",
    text: {
      hi: `अब भी दिक्कत है?\n\nकस्टमर केयर को कॉल करें।\n\n**नंबर:** ${CARE_NUMBER}`,
      en: `Still a problem?\n\nPlease call Customer Care.\n\n**Number:** ${CARE_NUMBER}`,
    },
    options: [mainMenu()],
  },

  // ============================================ KYC not approved / workflow
  kyc_wf1: {
    kind: "menu", icon: "id-card",
    text: {
      hi: "क्या आप **FMEG** पेज पर हैं?\n\n**Wires** पेज पर हैं तो **FMEG** पेज पर जाएँ।",
      en: "Are you on the **FMEG** page?\n\nIf on the **Wires** page, go to the **FMEG** page.",
    },
    options: [
      { id: "go_fmeg", icon: "plug", label: { hi: "FMEG पेज खोलें", en: "Open FMEG page" }, next: "resolved" },
      { id: "still", icon: "alert", label: { hi: "अब भी दिक्कत है", en: "Still a problem" }, next: "kyc_wf2" },
      back("fmeg_menu"), mainMenu(),
    ],
  },
  kyc_wf2: {
    kind: "info", icon: "id-card",
    text: {
      hi: "आपका **KYC** अभी अप्रूव नहीं हुआ।\n\n- आप **स्कैन** कर सकते हैं\n- पर **रिडीम** नहीं कर सकते\n\nकृपया अपने **ASM** से बात करें।",
      en: "Your **KYC** is not approved yet.\n\n- You can **scan**\n- But you cannot **redeem**\n\nPlease talk to your **ASM**.",
    },
    options: [
      talkAsm(),
      { id: "still", icon: "alert", label: { hi: "अब भी दिक्कत है", en: "Still a problem" }, next: "kyc_wf3" },
      back("kyc_wf1"), mainMenu(),
    ],
  },
  kyc_wf3: {
    kind: "menu", icon: "location",
    text: {
      hi: "फोन की **लोकेशन** चालू करें।",
      en: "Turn on phone **Location**.",
    },
    options: [
      { id: "checked", icon: "checklist", label: { hi: "देख लिया", en: "Checked" }, next: "kyc_wf4" },
      back("kyc_wf2"), mainMenu(),
    ],
  },
  kyc_wf4: {
    kind: "info", icon: "phone",
    text: {
      hi: `अब भी दिक्कत है?\n\nकस्टमर केयर को कॉल करें।\n\n**नंबर:** ${CARE_NUMBER}`,
      en: `Still a problem?\n\nPlease call Customer Care.\n\n**Number:** ${CARE_NUMBER}`,
    },
    options: [mainMenu()],
  },

  // ===================================================== scheme
  scheme: {
    kind: "info", icon: "star",
    text: {
      hi: "आपकी सभी स्कीमें **होम पेज** पर दिखती हैं।\n\nटीम के जाँचने के बाद आपको फायदा मिलेगा।",
      en: "All your schemes show on the **Home page**.\n\nYou get the benefit after the team checks it.",
    },
    options: [
      { id: "go_home_page", icon: "home", label: { hi: "होम पेज खोलें", en: "Open Home page" }, next: "resolved" },
      back("fmeg_menu"), mainMenu(),
    ],
  },

  // ===================================================== address update
  au1: {
    kind: "menu", icon: "location",
    text: {
      hi: "फोन की **लोकेशन** चालू करें।\n\nफिर से पता अपडेट करें।",
      en: "Turn on phone **Location**.\n\nThen update your address again.",
    },
    options: [
      { id: "checked", icon: "checklist", label: { hi: "देख लिया, फिर भी एरर है", en: "Checked, still an error" }, next: "au2" },
      back("fmeg_menu"), mainMenu(),
    ],
  },
  au2: {
    kind: "menu", icon: "user",
    text: {
      hi: "क्या आप **डिस्ट्रीब्यूटर** हैं?",
      en: "Are you a **distributor**?",
    },
    options: [
      { id: "is_distributor", icon: "checklist", label: { hi: "हाँ", en: "Yes" }, next: "au3a" },
      { id: "not_distributor", icon: "alert", label: { hi: "नहीं", en: "No" }, next: "au3b" },
      back("au1"), mainMenu(),
    ],
  },
  au3a: {
    kind: "info", icon: "alert",
    text: {
      hi: "यह ऐप **डिस्ट्रीब्यूटर** के लिए नहीं है।\n\nकृपया अपने **ASM** से बात करें।",
      en: "This app is not for **distributors**.\n\nPlease talk to your **ASM**.",
    },
    options: [talkAsm(), mainMenu()],
  },
  au3b: {
    kind: "info", icon: "id-card",
    text: {
      hi: "अगर यह एरर आता है:\n*Go to Edit Profile and add State and District*\n\nतो आपकी प्रोफ़ाइल **डिस्ट्रीब्यूटर** बनी है।\n\nठीक करने के लिए **ASM** से बात करें।",
      en: "If you see this error:\n*Go to Edit Profile and add State and District*\n\nthen your profile is set as **distributor**.\n\nTalk to your **ASM** to fix it.",
    },
    options: [
      talkAsm(),
      { id: "asm_done", icon: "alert", label: { hi: "ASM से बात की, फिर भी दिक्कत", en: "Talked to ASM, still a problem" }, next: "au4" },
      back("au2"), mainMenu(),
    ],
  },
  au4: {
    kind: "info", icon: "phone",
    text: {
      hi: `अब भी दिक्कत है?\n\nकस्टमर केयर को कॉल करें।\n\n**नंबर:** ${CARE_NUMBER}`,
      en: `Still a problem?\n\nPlease call Customer Care.\n\n**Number:** ${CARE_NUMBER}`,
    },
    options: [mainMenu()],
  },

  // ===================================================== wrong role
  wrong_role: {
    kind: "info", icon: "user",
    text: {
      hi: "भूमिका बदलने के लिए अपने **ASM** से कहें।\n\nASM को भेजना होगा:\n1. आपकी **दुकान की फोटो**\n2. आपका **विज़िटिंग कार्ड**\n3. भूमिका बदलने का **ईमेल**",
      en: "To change your role, ask your **ASM**.\n\nYour ASM must send:\n1. Your **shop photo**\n2. Your **visiting card**\n3. A role-change **email**",
    },
    options: [talkAsm(), back("fmeg_menu"), mainMenu()],
  },

  // ===================================================== shared end states
  talk_asm: {
    kind: "info", icon: "headset",
    text: {
      hi: "इसमें आपका **ASM** मदद करेगा।\n\nकृपया अपने ASM से बात करें।",
      en: "Your **ASM** will help with this.\n\nPlease talk to your ASM.",
    },
    options: [mainMenu()],
  },
  resolved: {
    kind: "info", icon: "checklist",
    text: {
      hi: "बढ़िया!\n\nक्या मैं और मदद करूँ?",
      en: "Great!\n\nCan I help with anything else?",
    },
    options: [
      mainMenu(),
      { id: "more_help", icon: "list", label: L_MORE, next: "fmeg_menu" },
    ],
  },
  exit: {
    kind: "end", icon: "wave",
    text: {
      hi: "धन्यवाद!\n\n**RR Connect सहायक** का उपयोग करने के लिए शुक्रिया।",
      en: "Thank you!\n\nThanks for using **RR Connect Sahayak**.",
    },
    options: [mainMenu()],
  },
};

// ---- Engine (pure, deterministic) -------------------------------------------

/** Pick `lang` from a {lang: text} map, falling back hi -> en. */
export function localize(mapping: Loc | undefined, lang: LangCode): string {
  if (!mapping) return "";
  if (mapping[lang]) return mapping[lang] as string;
  for (const fb of FALLBACK) {
    if (mapping[fb]) return mapping[fb] as string;
  }
  const first = Object.values(mapping)[0];
  return first ?? "";
}

export function nodeExists(nodeId: string): boolean {
  return nodeId in NODES;
}

export function renderOption(opt: RawOption, lang: LangCode): ChatOption {
  const out: ChatOption = {
    id: opt.id,
    icon: opt.icon ?? "dot",
    label: localize(opt.label, lang),
  };
  if (opt.action) out.action = opt.action;
  return out;
}

/** Build the payload the frontend renders for one node. */
export function renderNode(nodeId: string, lang: LangCode): ChatNode {
  const node = NODES[nodeId];
  return {
    node_id: nodeId,
    kind: node.kind,
    icon: node.icon ?? "chat",
    text: localize(node.text, lang),
    options: (node.options ?? []).map((o) => renderOption(o, lang)),
  };
}

/** Return the chosen option if it is valid for this node, else null. */
export function resolveOption(nodeId: string, optionId: string): RawOption | null {
  const node = NODES[nodeId];
  if (!node) return null;
  for (const opt of node.options ?? []) {
    if (opt.id === optionId) return opt;
  }
  return null;
}

export function normalizeLang(lang: string | null | undefined): LangCode {
  return lang && (LANGUAGES as string[]).includes(lang) ? (lang as LangCode) : DEFAULT_LANGUAGE;
}

// The "Get my ASM number" option injected on the talk_asm node when no pincode
// is known yet. Tapping it opens the on-screen number pad.
export const GET_ASM_OPTION: RawOption = {
  id: "get_asm",
  icon: "location",
  label: { hi: "अपना ASM नंबर पाएँ", en: "Get my ASM number" },
  action: { type: "pincode" },
};
