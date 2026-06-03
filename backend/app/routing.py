"""Pincode -> ASM lookup used to personalise the 'Talk to ASM' step."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import PincodeMapping

# Role option id -> segment in the pincode sheets.
ROLE_SEGMENT = {"electrician": "KD", "retailer": "KC"}


async def find_mapping(
    db: AsyncSession, pincode: str | None, segment: str | None
) -> PincodeMapping | None:
    """Best match for a pincode. Prefers the user's segment, else any segment."""
    if not pincode:
        return None
    stmt = select(PincodeMapping).where(PincodeMapping.pincode == pincode)
    if segment:
        stmt = stmt.order_by((PincodeMapping.segment == segment).desc())
    rows = (await db.execute(stmt.limit(1))).scalars().first()
    return rows
