"""Bijli Mitra API — a deterministic, menu-driven support bot. No LLM.

Endpoints:
  GET  /health
  GET  /languages                 -> supported UI languages
  POST /chat/start                 -> create session, return the welcome node
  POST /chat/select                -> validate the tapped option, advance, return next node
  GET  /chat/session/{id}          -> re-render the current node (resume / language switch)
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import settings
from .db import get_session, init_db
from .flow import engine, seed
from .flow.seed import START_NODE
from .models import ChatSession, ChatStep
from .routing import ROLE_SEGMENT, find_mapping
from .schemas import (
    ChatStateOut,
    LanguageOut,
    LanguagesOut,
    PincodeRequest,
    SelectRequest,
    StartRequest,
)

log = logging.getLogger("bijli")

LANGUAGE_META = {
    "hi": ("Hindi", "हिन्दी"),
    "en": ("English", "English"),
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Self-seed the pincode->ASM mapping on a fresh database. No-op once loaded,
    # so managed hosts (Render free tier, etc.) need no separate import step.
    from scripts.import_pincode import seed_if_empty

    await seed_if_empty()
    yield


app = FastAPI(title="RR Connect Sahayak API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.frontend_origin.split(",") if o.strip()],
    allow_origin_regex=r"http://localhost:\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)


def _normalize_lang(lang: str | None) -> str:
    return lang if lang in engine.LANGUAGES else settings.default_language


async def render_state(node_id: str, lang: str, session: ChatSession, db: AsyncSession) -> dict:
    """Render a node, personalising 'Talk to ASM' with the user's area ASM.

    The app is an embedded webview, so we SHOW phone numbers as text rather than
    trigger a direct dial. Three cases on the talk_asm node:
      - ASM known  -> show their name + number as text
      - pincode given but no ASM -> show the customer-care number as text
      - no pincode yet -> offer 'Get my ASM number' (opens the number pad)
    """
    payload = engine.render_node(node_id, lang)
    if node_id != "talk_asm":
        return payload

    mapping = await find_mapping(db, session.pincode, session.segment)
    if mapping and mapping.asm_phone:
        name = mapping.asm_name or "ASM"
        phone = mapping.asm_phone
        line = {"hi": f"\n\n**आपके इलाके के ASM:**\n{name}\n**फ़ोन नंबर:** {phone}",
                "en": f"\n\n**Your area ASM:**\n{name}\n**Phone number:** {phone}"}
        payload["text"] += line.get(lang, line["en"])
    elif session.pincode:
        line = {"hi": f"\n\n**इस पिनकोड के लिए ASM नहीं मिला।**\nकस्टमर केयर: {seed.CARE_NUMBER}",
                "en": f"\n\n**No ASM found for this pincode.**\nCustomer Care: {seed.CARE_NUMBER}"}
        payload["text"] += line.get(lang, line["en"])
    else:
        get_opt = {
            "id": "get_asm", "icon": "location",
            "label": {"hi": "अपना ASM नंबर पाएँ", "en": "Get my ASM number"},
            "action": {"type": "pincode"},
        }
        payload["options"] = [engine._render_option(get_opt, lang)] + payload["options"]
    return payload


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/languages", response_model=LanguagesOut)
async def languages():
    return LanguagesOut(
        languages=[
            LanguageOut(code=c, name=LANGUAGE_META[c][0], native=LANGUAGE_META[c][1])
            for c in engine.LANGUAGES
        ]
    )


@app.post("/chat/start", response_model=ChatStateOut)
async def chat_start(req: StartRequest, db: AsyncSession = Depends(get_session)):
    lang = _normalize_lang(req.language)
    session = ChatSession(
        language=lang,
        current_node=START_NODE,
        user_ref=req.user_ref,
        pincode=req.pincode,
        segment=req.segment,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return ChatStateOut(
        session_id=session.id,
        language=lang,
        node=await render_state(START_NODE, lang, session, db),
    )


@app.post("/chat/select", response_model=ChatStateOut)
async def chat_select(req: SelectRequest, db: AsyncSession = Depends(get_session)):
    session = await db.get(ChatSession, req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="session not found")

    if req.language:
        session.language = _normalize_lang(req.language)
    lang = session.language

    option = engine.resolve_option(session.current_node, req.option_id)
    if option is None:
        # Not an allowed move from the current node — refuse (deterministic guard).
        raise HTTPException(status_code=400, detail="invalid option for current node")

    from_node = session.current_node
    next_node = option.get("next")

    if next_node and engine.node_exists(next_node):
        session.current_node = next_node

    # The role choice tells us the segment (KD influencer / KC retailer) for ASM lookup.
    if req.option_id in ROLE_SEGMENT and not session.segment:
        session.segment = ROLE_SEGMENT[req.option_id]

    db.add(
        ChatStep(
            session_id=session.id,
            from_node=from_node,
            chosen_option=req.option_id,
            to_node=session.current_node,
        )
    )
    await db.commit()

    return ChatStateOut(
        session_id=session.id,
        language=lang,
        node=await render_state(session.current_node, lang, session, db),
    )


@app.get("/chat/session/{session_id}", response_model=ChatStateOut)
async def chat_resume(session_id: str, language: str | None = None, db: AsyncSession = Depends(get_session)):
    session = await db.get(ChatSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="session not found")
    if language:
        session.language = _normalize_lang(language)
        await db.commit()
    return ChatStateOut(
        session_id=session.id,
        language=session.language,
        node=await render_state(session.current_node, session.language, session, db),
    )


@app.post("/chat/pincode", response_model=ChatStateOut)
async def chat_pincode(req: PincodeRequest, db: AsyncSession = Depends(get_session)):
    """Save a pincode entered on the number pad and show the matching ASM."""
    session = await db.get(ChatSession, req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="session not found")

    pin = "".join(ch for ch in req.pincode if ch.isdigit())
    if len(pin) != 6:
        raise HTTPException(status_code=400, detail="pincode must be 6 digits")

    session.pincode = pin
    session.current_node = "talk_asm"  # so the call / menu options stay valid
    await db.commit()

    return ChatStateOut(
        session_id=session.id,
        language=session.language,
        node=await render_state("talk_asm", session.language, session, db),
    )
