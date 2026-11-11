// Dev-only: the kit colour tokens (--sprd-*) from app/globals.css, for the
// Cmd+E edit mode's palette. 404 outside `next dev`.
import { promises as fs } from "fs"
import { NextResponse } from "next/server"
import path from "path"

const TOKEN_RE = /--sprd-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g

export async function GET() {
  if (process.env.NODE_ENV !== "development") return new NextResponse(null, { status: 404 })
  const css = await fs.readFile(path.join(process.cwd(), "app", "globals.css"), "utf8")
  const seen = new Set<string>()
  const tokens: { name: string; value: string }[] = []
  for (const match of css.matchAll(TOKEN_RE)) {
    const [, name, value] = match
    if (seen.has(name)) continue
    seen.add(name)
    tokens.push({ name, value })
  }
  return NextResponse.json({ tokens })
}
