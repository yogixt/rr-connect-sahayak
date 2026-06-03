from __future__ import annotations

from pydantic import BaseModel, Field


class StartRequest(BaseModel):
    language: str = "hi"
    user_ref: str | None = None
    # Passed by the host app so the bot can show the user's area ASM.
    pincode: str | None = None
    segment: str | None = None  # "KC" retailer / "KD" influencer; else set from role


class SelectRequest(BaseModel):
    session_id: str
    option_id: str
    # Allow switching language mid-conversation (re-renders current node).
    language: str | None = None


class PincodeRequest(BaseModel):
    session_id: str
    pincode: str


class OptionOut(BaseModel):
    id: str
    icon: str
    label: str
    action: dict | None = None


class NodeOut(BaseModel):
    node_id: str
    kind: str
    icon: str
    text: str
    options: list[OptionOut]


class ChatStateOut(BaseModel):
    session_id: str
    language: str
    node: NodeOut


class LanguageOut(BaseModel):
    code: str
    name: str
    native: str


class LanguagesOut(BaseModel):
    languages: list[LanguageOut] = Field(default_factory=list)
