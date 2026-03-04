import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { analyzeRoyaltyStatement } from "@/lib/ai";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  // Any authenticated user can analyze a document

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  let pdfText = "";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    try {
      const parsed = await pdfParse(buffer);
      pdfText = parsed.text;
    } catch {
      // If PDF parsing fails, fall back to filename-only analysis
      pdfText = "";
    }
  }

  const analysis = await analyzeRoyaltyStatement(file.name, pdfText);

  if (!analysis) {
    return NextResponse.json({
      title: file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "),
      category: "recording",
      source: "Other",
      period: "",
      amount: null,
    });
  }

  return NextResponse.json(analysis);
}
