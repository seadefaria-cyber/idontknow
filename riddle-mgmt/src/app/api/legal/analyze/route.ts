import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { analyzeLegalDocument } from "@/lib/ai";
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
      // Fall back to filename-only analysis
    }
  }

  const analysis = await analyzeLegalDocument(file.name, file.type || "application/octet-stream", pdfText);

  if (!analysis) {
    return NextResponse.json({
      suggestedTitle: file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "),
      category: "other",
      summary: "",
    });
  }

  return NextResponse.json(analysis);
}
