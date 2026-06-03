"""Database tables: a chat session and the log of every step taken in it.

These exist purely for conversation logging + analytics (which paths electricians
use most, where they drop off, how often they call). They never drive the flow —
seed.py + engine.py do that.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _uuid() -> str:
    return uuid.uuid4().hex


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    language: Mapped[str] = mapped_column(String(8), default="hi")
    current_node: Mapped[str] = mapped_column(String(64))
    # Optional electrician identity passed by the host app (phone / loyalty id).
    user_ref: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Used to look up the user's area ASM. Pincode comes from the host app;
    # segment (KC retailer / KD influencer) is set from the role they pick.
    pincode: Mapped[str | None] = mapped_column(String(6), nullable=True)
    segment: Mapped[str | None] = mapped_column(String(2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    steps: Mapped[list["ChatStep"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class ChatStep(Base):
    __tablename__ = "chat_steps"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("chat_sessions.id", ondelete="CASCADE"))
    # The node the user was on and the option they tapped to leave it.
    from_node: Mapped[str] = mapped_column(String(64))
    chosen_option: Mapped[str | None] = mapped_column(String(64), nullable=True)
    to_node: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    session: Mapped["ChatSession"] = relationship(back_populates="steps")


class PincodeMapping(Base):
    """Pincode -> Sales Engineer / Area Sales Manager, per segment (KC / KD).

    Imported from the RR Kabel pincode mapping sheets (see scripts/import_pincode.py).
    Read-only at runtime: used to show a user the correct ASM to contact for their area.
    """

    __tablename__ = "pincode_mapping"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    pincode: Mapped[str] = mapped_column(String(6))
    segment: Mapped[str] = mapped_column(String(2))
    statename: Mapped[str | None] = mapped_column(String(64), nullable=True)
    district: Mapped[str | None] = mapped_column(String(64), nullable=True)
    se_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    se_phone: Mapped[str | None] = mapped_column(String(10), nullable=True)
    asm_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    asm_phone: Mapped[str | None] = mapped_column(String(10), nullable=True)

    __table_args__ = (Index("ix_pincode_segment", "pincode", "segment"),)
