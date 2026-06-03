// Pincode -> ASM lookup. Replaces the FastAPI /chat/pincode personalisation.
// Holds the 39k-row directory server-side and returns only the single matching
// ASM, so the full phone list never ships to the browser.
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

export const runtime = "nodejs";

interface Row {
  segment: string;
  asm_name: string;
  asm_phone: string;
}

// Built once per warm function instance and cached at module scope. Parsing ~39k
// rows takes a few ms; warm invocations reuse the index.
let INDEX: Map<string, Row[]> | null = null;

function loadIndex(): Map<string, Row[]> {
  if (INDEX) return INDEX;
  const file = path.join(process.cwd(), "data", "pincode_mapping.csv.gz");
  const csv = gunzipSync(readFileSync(file)).toString("utf-8");
  const map = new Map<string, Row[]>();
  const lines = csv.split(/\r?\n/);
  // header: pincode,segment,statename,district,se_name,se_phone,asm_name,asm_phone
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const f = line.split(",");
    const pincode = f[0];
    if (!pincode) continue;
    const row: Row = { segment: f[1] ?? "", asm_name: f[6] ?? "", asm_phone: (f[7] ?? "").trim() };
    const arr = map.get(pincode);
    if (arr) arr.push(row);
    else map.set(pincode, [row]);
  }
  INDEX = map;
  return map;
}

export function GET(req: NextRequest) {
  const pincode = (req.nextUrl.searchParams.get("pincode") ?? "").replace(/\D/g, "");
  const segment = req.nextUrl.searchParams.get("segment") ?? "";

  if (pincode.length !== 6) {
    return NextResponse.json({ error: "pincode must be 6 digits" }, { status: 400 });
  }

  const rows = loadIndex().get(pincode);
  if (!rows || rows.length === 0) {
    return NextResponse.json({ mapping: null });
  }

  // Prefer the user's segment (KD/KC); otherwise take the first row for the pincode.
  const match = (segment && rows.find((r) => r.segment === segment)) || rows[0];
  return NextResponse.json({
    mapping: { asm_name: match.asm_name || null, asm_phone: match.asm_phone || null },
  });
}
