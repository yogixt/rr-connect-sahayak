"""The deterministic conversation flow — the single source of truth.

Implements the RR Connect Basic FAQ Chatbot spec: role (Electrician / Retailer) ->
query category (WCD / FMEG) -> fixed FMEG issue flows ending in a clear fix, an ASM
hand-off, or a customer-care call. No free typing, no image upload, no AI.

Writing style (intentional — the users may have low literacy):
  - Very short, simple sentences. Ask, don't lecture.
  - Instructions are numbered steps, one action per line.
  - Bold the important words / buttons with **double asterisks**.
The frontend renders **bold** and turns "1." / "2." lines into clear step rows.

Languages: hi (Hindi) and en (English) only. Missing strings fall back hi -> en.
To change what the bot says, edit this file and restart the backend.
"""

# Official RR Connect customer-care toll-free number (shown as text — the app is an
# embedded webview, so we display numbers rather than trigger a direct dial).
CARE_NUMBER = "1800 103 6633"

# ---- Reusable option labels -------------------------------------------------
L_MAIN = {"hi": "मुख्य मेन्यू", "en": "Main Menu"}
L_BACK = {"hi": "वापस", "en": "Back"}
L_ASM = {"hi": "ASM से बात करें", "en": "Talk to ASM"}
L_EXIT = {"hi": "बंद करें", "en": "Exit"}
L_MORE = {"hi": "और मदद चाहिए", "en": "More help"}


# ---- Option builders --------------------------------------------------------
def main_menu():
    return {"id": "main_menu", "icon": "home", "label": L_MAIN, "next": "start"}


def back(target):
    return {"id": "back", "icon": "back", "label": L_BACK, "next": target}


def talk_asm():
    return {"id": "talk_asm", "icon": "headset", "label": L_ASM, "next": "talk_asm"}


NODES = {
    # ===================================================== role / query category
    "start": {
        "kind": "menu", "icon": "wave",
        "text": {
            "hi": "नमस्ते!\nमैं **RR Connect सहायक** हूँ।\n\nआप कौन हैं?",
            "en": "Hello!\nI am **RR Connect Sahayak**.\n\nWho are you?",
        },
        "options": [
            {"id": "electrician", "icon": "wrench",
             "label": {"hi": "इलेक्ट्रिशियन", "en": "Electrician"}, "next": "query_category"},
            {"id": "retailer", "icon": "store",
             "label": {"hi": "रिटेलर", "en": "Retailer"}, "next": "query_category"},
        ],
    },
    "query_category": {
        "kind": "menu", "icon": "chat",
        "text": {
            "hi": "आपका सवाल किस बारे में है?",
            "en": "What is your question about?",
        },
        "options": [
            {"id": "wcd", "icon": "bolt", "label": {"hi": "WCD", "en": "WCD"}, "next": "wcd"},
            {"id": "fmeg", "icon": "plug", "label": {"hi": "FMEG", "en": "FMEG"}, "next": "fmeg_menu"},
            main_menu(),
        ],
    },

    # ===================================================================== WCD
    "wcd": {
        "kind": "info", "icon": "bolt",
        "text": {
            "hi": f"तार और केबल (WCD) के लिए हमें कॉल करें।\n\n**फ्री नंबर:** {CARE_NUMBER}",
            "en": f"For Wires & Cables (WCD), please call us.\n\n**Free number:** {CARE_NUMBER}",
        },
        "options": [main_menu(),
                    {"id": "exit", "icon": "logout", "label": L_EXIT, "next": "exit"}],
    },

    # ============================================================ FMEG main menu
    "fmeg_menu": {
        "kind": "menu", "icon": "plug",
        "text": {
            "hi": "आपको किसमें दिक्कत है?",
            "en": "What do you need help with?",
        },
        "options": [
            {"id": "qr", "icon": "qr",
             "label": {"hi": "QR स्कैन नहीं हो रहा", "en": "Can't scan QR"}, "next": "qr1"},
            {"id": "redeem", "icon": "rupee",
             "label": {"hi": "पॉइंट्स रिडीम नहीं हो रहे", "en": "Can't redeem points"}, "next": "rp1"},
            {"id": "kyc", "icon": "id-card",
             "label": {"hi": "KYC पूरा नहीं हो रहा", "en": "Can't complete KYC"}, "next": "kyc1"},
            {"id": "kyc_wf", "icon": "id-card",
             "label": {"hi": "KYC अप्रूव नहीं हुआ", "en": "KYC not approved"}, "next": "kyc_wf1"},
            {"id": "scheme", "icon": "star",
             "label": {"hi": "स्कीम की जानकारी", "en": "Scheme info"}, "next": "scheme"},
            {"id": "address", "icon": "location",
             "label": {"hi": "पता अपडेट नहीं हो रहा", "en": "Can't update address"}, "next": "au1"},
            {"id": "wrong_role", "icon": "user",
             "label": {"hi": "गलत भूमिका", "en": "Wrong role"}, "next": "wrong_role"},
            back("query_category"), main_menu(),
        ],
    },

    # ========================================================= QR scan flow
    "qr1": {
        "kind": "menu", "icon": "qr",
        "text": {
            "hi": "स्कैन से पहले यह देखें:\n\n1. क्या आप **FMEG** पेज पर हैं?\n2. क्या फोन की **लोकेशन** चालू है?",
            "en": "Check these before scanning:\n\n1. Are you on the **FMEG** page?\n2. Is phone **Location** ON?",
        },
        "options": [
            {"id": "checked", "icon": "checklist",
             "label": {"hi": "हाँ, देख लिया", "en": "Yes, checked"}, "next": "qr2"},
            back("fmeg_menu"), main_menu(),
        ],
    },
    "qr2": {
        "kind": "menu", "icon": "qr",
        "text": {
            "hi": "स्क्रीन पर क्या दिक्कत दिख रही है?",
            "en": "What problem do you see on the screen?",
        },
        "options": [
            {"id": "code_missing", "icon": "alert",
             "label": {"hi": "कोड मौजूद नहीं है", "en": "Code does not exist"}, "next": "qr_code_missing"},
            {"id": "enable_loc", "icon": "location",
             "label": {"hi": "लोकेशन चालू करनी है", "en": "Enable location"}, "next": "qr_location"},
            {"id": "scanned_other", "icon": "alert",
             "label": {"hi": "किसी और ने स्कैन किया", "en": "Scanned by someone else"}, "next": "qr_scanned_other"},
            {"id": "scanned_self", "icon": "clock",
             "label": {"hi": "मैंने पहले स्कैन किया था", "en": "I scanned it before"}, "next": "qr_scanned_self"},
            back("qr1"), main_menu(),
        ],
    },
    "qr_code_missing": {
        "kind": "info", "icon": "alert",
        "text": {
            "hi": "यह कोड स्कैन नहीं हो सकता।\n\nकृपया अपने **ASM** से बात करें।",
            "en": "This code cannot be scanned.\n\nPlease talk to your **ASM**.",
        },
        "options": [talk_asm(), back("qr2"), main_menu()],
    },
    "qr_location": {
        "kind": "info", "icon": "location",
        "text": {
            "hi": "लोकेशन चालू करें:\n\n1. फोन की **सेटिंग** खोलें\n2. **RR Connect** को लोकेशन की अनुमति दें\n3. **लोकेशन** चालू करें\n4. फिर से स्कैन करें",
            "en": "Turn on Location:\n\n1. Open phone **Settings**\n2. Allow **RR Connect** to use location\n3. Turn **Location** ON\n4. Scan again",
        },
        "options": [
            {"id": "try_again", "icon": "refresh",
             "label": {"hi": "फिर से कोशिश करें", "en": "Try Again"}, "next": "resolved"},
            back("qr2"), main_menu(),
        ],
    },
    "qr_scanned_other": {
        "kind": "info", "icon": "alert",
        "text": {
            "hi": "यह कोड किसी और ने स्कैन कर लिया है।\n\nकृपया अपने **ASM** से बात करें।",
            "en": "Someone else has already scanned this code.\n\nPlease talk to your **ASM**.",
        },
        "options": [talk_asm(), back("qr2"), main_menu()],
    },
    "qr_scanned_self": {
        "kind": "info", "icon": "clock",
        "text": {
            "hi": "शायद आपके पॉइंट्स जुड़ चुके हैं।\n\n1. अपनी **स्कैन हिस्ट्री** देखें\n2. न दिखें तो **24 घंटे** रुकें\n3. फिर भी दिक्कत हो तो **ASM** से बात करें",
            "en": "Your points may already be added.\n\n1. Check your **Scan History**\n2. If not shown, wait **24 hours**\n3. Still a problem? Talk to your **ASM**",
        },
        "options": [
            {"id": "scan_history", "icon": "clock",
             "label": {"hi": "स्कैन हिस्ट्री देखें", "en": "Check Scan History"}, "next": "resolved"},
            talk_asm(), back("qr2"), main_menu(),
        ],
    },

    # ===================================================== redeem points
    "rp1": {
        "kind": "menu", "icon": "rupee",
        "text": {
            "hi": "रिडीम से पहले यह देखें:\n\n1. कम से कम **300 पॉइंट्स** हों\n2. फोन की **लोकेशन** चालू हो\n3. आपका **KYC** अप्रूव हो",
            "en": "Check before redeeming:\n\n1. You need at least **300 points**\n2. Phone **Location** must be ON\n3. Your **KYC** must be approved",
        },
        "options": [
            {"id": "checked", "icon": "checklist",
             "label": {"hi": "देख लिया, फिर भी दिक्कत है", "en": "Checked, still a problem"}, "next": "rp2"},
            back("fmeg_menu"), main_menu(),
        ],
    },
    "rp2": {
        "kind": "info", "icon": "phone",
        "text": {
            "hi": f"अब भी दिक्कत है?\n\nकस्टमर केयर को कॉल करें।\n\n**नंबर:** {CARE_NUMBER}",
            "en": f"Still a problem?\n\nPlease call Customer Care.\n\n**Number:** {CARE_NUMBER}",
        },
        "options": [main_menu()],
    },

    # ===================================================== complete KYC
    "kyc1": {
        "kind": "menu", "icon": "id-card",
        "text": {
            "hi": "आप अभी कौन से पेज पर हैं?",
            "en": "Which page are you on now?",
        },
        "options": [
            {"id": "on_fmeg", "icon": "plug",
             "label": {"hi": "मैं FMEG पर हूँ", "en": "I am on FMEG"}, "next": "kyc2b"},
            {"id": "on_wires", "icon": "bolt",
             "label": {"hi": "मैं Wires पर हूँ", "en": "I am on Wires"}, "next": "kyc2a"},
            back("fmeg_menu"), main_menu(),
        ],
    },
    "kyc2a": {
        "kind": "info", "icon": "plug",
        "text": {
            "hi": "**FMEG** पेज पर जाएँ और फिर से कोशिश करें।\n\nइससे दिक्कत ठीक हो जाएगी।",
            "en": "Go to the **FMEG** page and try again.\n\nThis should fix it.",
        },
        "options": [
            {"id": "go_fmeg", "icon": "plug",
             "label": {"hi": "FMEG पेज खोलें", "en": "Open FMEG page"}, "next": "resolved"},
            main_menu(),
        ],
    },
    "kyc2b": {
        "kind": "info", "icon": "id-card",
        "text": {
            "hi": "आपका **KYC** अभी अप्रूव नहीं हुआ।\n\n- आप **स्कैन** कर सकते हैं\n- पर **रिडीम** नहीं कर सकते\n\nकृपया अपने **ASM** से बात करें।",
            "en": "Your **KYC** is not approved yet.\n\n- You can **scan**\n- But you cannot **redeem**\n\nPlease talk to your **ASM**.",
        },
        "options": [
            talk_asm(),
            {"id": "still", "icon": "alert",
             "label": {"hi": "अब भी दिक्कत है", "en": "Still a problem"}, "next": "kyc3"},
            back("kyc1"), main_menu(),
        ],
    },
    "kyc3": {
        "kind": "menu", "icon": "location",
        "text": {
            "hi": "फोन की **लोकेशन** चालू करें।\n\nफिर से कोशिश करें।",
            "en": "Turn on phone **Location**.\n\nThen try again.",
        },
        "options": [
            {"id": "checked", "icon": "checklist",
             "label": {"hi": "देख लिया, फिर भी दिक्कत है", "en": "Checked, still a problem"}, "next": "kyc4"},
            back("kyc2b"), main_menu(),
        ],
    },
    "kyc4": {
        "kind": "info", "icon": "phone",
        "text": {
            "hi": f"अब भी दिक्कत है?\n\nकस्टमर केयर को कॉल करें।\n\n**नंबर:** {CARE_NUMBER}",
            "en": f"Still a problem?\n\nPlease call Customer Care.\n\n**Number:** {CARE_NUMBER}",
        },
        "options": [main_menu()],
    },

    # ============================================ KYC not approved / workflow
    "kyc_wf1": {
        "kind": "menu", "icon": "id-card",
        "text": {
            "hi": "क्या आप **FMEG** पेज पर हैं?\n\n**Wires** पेज पर हैं तो **FMEG** पेज पर जाएँ।",
            "en": "Are you on the **FMEG** page?\n\nIf on the **Wires** page, go to the **FMEG** page.",
        },
        "options": [
            {"id": "go_fmeg", "icon": "plug",
             "label": {"hi": "FMEG पेज खोलें", "en": "Open FMEG page"}, "next": "resolved"},
            {"id": "still", "icon": "alert",
             "label": {"hi": "अब भी दिक्कत है", "en": "Still a problem"}, "next": "kyc_wf2"},
            back("fmeg_menu"), main_menu(),
        ],
    },
    "kyc_wf2": {
        "kind": "info", "icon": "id-card",
        "text": {
            "hi": "आपका **KYC** अभी अप्रूव नहीं हुआ।\n\n- आप **स्कैन** कर सकते हैं\n- पर **रिडीम** नहीं कर सकते\n\nकृपया अपने **ASM** से बात करें।",
            "en": "Your **KYC** is not approved yet.\n\n- You can **scan**\n- But you cannot **redeem**\n\nPlease talk to your **ASM**.",
        },
        "options": [
            talk_asm(),
            {"id": "still", "icon": "alert",
             "label": {"hi": "अब भी दिक्कत है", "en": "Still a problem"}, "next": "kyc_wf3"},
            back("kyc_wf1"), main_menu(),
        ],
    },
    "kyc_wf3": {
        "kind": "menu", "icon": "location",
        "text": {
            "hi": "फोन की **लोकेशन** चालू करें।",
            "en": "Turn on phone **Location**.",
        },
        "options": [
            {"id": "checked", "icon": "checklist",
             "label": {"hi": "देख लिया", "en": "Checked"}, "next": "kyc_wf4"},
            back("kyc_wf2"), main_menu(),
        ],
    },
    "kyc_wf4": {
        "kind": "info", "icon": "phone",
        "text": {
            "hi": f"अब भी दिक्कत है?\n\nकस्टमर केयर को कॉल करें।\n\n**नंबर:** {CARE_NUMBER}",
            "en": f"Still a problem?\n\nPlease call Customer Care.\n\n**Number:** {CARE_NUMBER}",
        },
        "options": [main_menu()],
    },

    # ===================================================== scheme
    "scheme": {
        "kind": "info", "icon": "star",
        "text": {
            "hi": "आपकी सभी स्कीमें **होम पेज** पर दिखती हैं।\n\nटीम के जाँचने के बाद आपको फायदा मिलेगा।",
            "en": "All your schemes show on the **Home page**.\n\nYou get the benefit after the team checks it.",
        },
        "options": [
            {"id": "go_home_page", "icon": "home",
             "label": {"hi": "होम पेज खोलें", "en": "Open Home page"}, "next": "resolved"},
            back("fmeg_menu"), main_menu(),
        ],
    },

    # ===================================================== address update
    "au1": {
        "kind": "menu", "icon": "location",
        "text": {
            "hi": "फोन की **लोकेशन** चालू करें।\n\nफिर से पता अपडेट करें।",
            "en": "Turn on phone **Location**.\n\nThen update your address again.",
        },
        "options": [
            {"id": "checked", "icon": "checklist",
             "label": {"hi": "देख लिया, फिर भी एरर है", "en": "Checked, still an error"}, "next": "au2"},
            back("fmeg_menu"), main_menu(),
        ],
    },
    "au2": {
        "kind": "menu", "icon": "user",
        "text": {
            "hi": "क्या आप **डिस्ट्रीब्यूटर** हैं?",
            "en": "Are you a **distributor**?",
        },
        "options": [
            {"id": "is_distributor", "icon": "checklist",
             "label": {"hi": "हाँ", "en": "Yes"}, "next": "au3a"},
            {"id": "not_distributor", "icon": "alert",
             "label": {"hi": "नहीं", "en": "No"}, "next": "au3b"},
            back("au1"), main_menu(),
        ],
    },
    "au3a": {
        "kind": "info", "icon": "alert",
        "text": {
            "hi": "यह ऐप **डिस्ट्रीब्यूटर** के लिए नहीं है।\n\nकृपया अपने **ASM** से बात करें।",
            "en": "This app is not for **distributors**.\n\nPlease talk to your **ASM**.",
        },
        "options": [talk_asm(), main_menu()],
    },
    "au3b": {
        "kind": "info", "icon": "id-card",
        "text": {
            "hi": "अगर यह एरर आता है:\n*Go to Edit Profile and add State and District*\n\nतो आपकी प्रोफ़ाइल **डिस्ट्रीब्यूटर** बनी है।\n\nठीक करने के लिए **ASM** से बात करें।",
            "en": "If you see this error:\n*Go to Edit Profile and add State and District*\n\nthen your profile is set as **distributor**.\n\nTalk to your **ASM** to fix it.",
        },
        "options": [
            talk_asm(),
            {"id": "asm_done", "icon": "alert",
             "label": {"hi": "ASM से बात की, फिर भी दिक्कत", "en": "Talked to ASM, still a problem"}, "next": "au4"},
            back("au2"), main_menu(),
        ],
    },
    "au4": {
        "kind": "info", "icon": "phone",
        "text": {
            "hi": f"अब भी दिक्कत है?\n\nकस्टमर केयर को कॉल करें।\n\n**नंबर:** {CARE_NUMBER}",
            "en": f"Still a problem?\n\nPlease call Customer Care.\n\n**Number:** {CARE_NUMBER}",
        },
        "options": [main_menu()],
    },

    # ===================================================== wrong role
    "wrong_role": {
        "kind": "info", "icon": "user",
        "text": {
            "hi": "भूमिका बदलने के लिए अपने **ASM** से कहें।\n\nASM को भेजना होगा:\n1. आपकी **दुकान की फोटो**\n2. आपका **विज़िटिंग कार्ड**\n3. भूमिका बदलने का **ईमेल**",
            "en": "To change your role, ask your **ASM**.\n\nYour ASM must send:\n1. Your **shop photo**\n2. Your **visiting card**\n3. A role-change **email**",
        },
        "options": [talk_asm(), back("fmeg_menu"), main_menu()],
    },

    # ===================================================== shared end states
    "talk_asm": {
        "kind": "info", "icon": "headset",
        "text": {
            "hi": "इसमें आपका **ASM** मदद करेगा।\n\nकृपया अपने ASM से बात करें।",
            "en": "Your **ASM** will help with this.\n\nPlease talk to your ASM.",
        },
        "options": [main_menu()],
    },
    "resolved": {
        "kind": "info", "icon": "checklist",
        "text": {
            "hi": "बढ़िया!\n\nक्या मैं और मदद करूँ?",
            "en": "Great!\n\nCan I help with anything else?",
        },
        "options": [
            main_menu(),
            {"id": "more_help", "icon": "list", "label": L_MORE, "next": "fmeg_menu"},
        ],
    },
    "exit": {
        "kind": "end", "icon": "wave",
        "text": {
            "hi": "धन्यवाद!\n\n**RR Connect सहायक** का उपयोग करने के लिए शुक्रिया।",
            "en": "Thank you!\n\nThanks for using **RR Connect Sahayak**.",
        },
        "options": [main_menu()],
    },
}

# The first node every new session starts at (role selection).
START_NODE = "start"
