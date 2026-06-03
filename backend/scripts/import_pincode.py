"""Load the bundled pincode -> SE/ASM mapping into Postgres.

The data ships with the repo as a small gzipped CSV (data/pincode_mapping.csv.gz),
so this needs no spreadsheet libraries and can run inside the backend container:

    docker compose exec backend python -m scripts.import_pincode

It is idempotent — it clears the table and reloads. Duplicate (pincode, segment)
rows in the source are de-duplicated, keeping the first.

On managed hosts (Render free tier, etc.) there is no separate "run this once"
step, so the API also calls ``seed_if_empty()`` on startup — it loads the data
only when the table is empty, making a fresh deploy fully self-seeding.
"""
from __future__ import annotations

import asyncio
import csv
import gzip
import logging
import os

from sqlalchemy import delete, func, insert, select

from app.db import SessionLocal, init_db
from app.models import PincodeMapping

log = logging.getLogger("bijli")

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "pincode_mapping.csv.gz")
BATCH = 2000


def _read_rows():
    seen: set[tuple[str, str]] = set()
    with gzip.open(DATA_FILE, "rt", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            key = (row["pincode"], row["segment"])
            if not row["pincode"] or key in seen:
                continue
            seen.add(key)
            yield {k: (v or None) for k, v in row.items()}


async def _reload() -> int:
    """Clear the table and bulk-load every row. Returns the row count."""
    rows = list(_read_rows())
    async with SessionLocal() as db:
        await db.execute(delete(PincodeMapping))
        for i in range(0, len(rows), BATCH):
            await db.execute(insert(PincodeMapping), rows[i : i + BATCH])
        await db.commit()
    return len(rows)


async def seed_if_empty() -> int:
    """Load the mapping only when the table has no rows (startup hook).

    Returns the number of rows loaded, or 0 if the table was already populated.
    Safe to call on every boot — a warm DB is left untouched.
    """
    async with SessionLocal() as db:
        existing = await db.scalar(select(func.count()).select_from(PincodeMapping))
    if existing:
        log.info("pincode mapping already loaded (%s rows) — skipping seed", existing)
        return 0
    loaded = await _reload()
    log.info("seeded %s pincode rows", loaded)
    return loaded


async def main() -> None:
    await init_db()
    loaded = await _reload()
    print(f"Loaded {loaded} pincode rows.")


if __name__ == "__main__":
    asyncio.run(main())
