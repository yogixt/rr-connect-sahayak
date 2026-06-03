"""Load the bundled pincode -> SE/ASM mapping into Postgres.

The data ships with the repo as a small gzipped CSV (data/pincode_mapping.csv.gz),
so this needs no spreadsheet libraries and can run inside the backend container:

    docker compose exec backend python -m scripts.import_pincode

It is idempotent — it clears the table and reloads. Duplicate (pincode, segment)
rows in the source are de-duplicated, keeping the first.
"""
from __future__ import annotations

import asyncio
import csv
import gzip
import os

from sqlalchemy import delete, insert

from app.db import SessionLocal, init_db
from app.models import PincodeMapping

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


async def main() -> None:
    await init_db()
    rows = list(_read_rows())
    async with SessionLocal() as db:
        await db.execute(delete(PincodeMapping))
        for i in range(0, len(rows), BATCH):
            await db.execute(insert(PincodeMapping), rows[i : i + BATCH])
        await db.commit()
    print(f"Loaded {len(rows)} pincode rows.")


if __name__ == "__main__":
    asyncio.run(main())
