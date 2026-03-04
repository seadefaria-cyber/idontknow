import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-5-20250929";

function getClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

async function ask(prompt: string, maxTokens = 200): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const block = res.content[0];
  if (block.type === "text") return block.text;
  return null;
}

// --- File classification ---

interface FileClassification {
  folder: string;
  description: string;
}

export async function classifyFile(
  fileName: string,
  mimeType: string,
  fileSize: number
): Promise<FileClassification | null> {
  try {
    const text = await ask(
      `Classify this file for a music management company's portal.
File: "${fileName}" (${mimeType}, ${fileSize} bytes)
Available folders: documents, metrics, assets

Reply with ONLY valid JSON:
{"folder":"<documents|metrics|assets>","description":"<short 5-10 word description>"}`,
      100
    );
    if (!text) return null;
    const match = text.match(/\{[^}]+\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (parsed.folder && parsed.description) return parsed;
    return null;
  } catch {
    return null;
  }
}

// --- Legal document analysis ---

interface LegalAnalysis {
  suggestedTitle: string;
  category: string;
  summary: string;
  signed: boolean;
}

export async function analyzeLegalDocument(
  fileName: string,
  mimeType: string,
  pdfText?: string
): Promise<LegalAnalysis | null> {
  try {
    const truncated = pdfText ? pdfText.slice(0, 4000) : "";
    const contentSection = truncated
      ? `\n\nExtracted text from the document:\n"""\n${truncated}\n"""`
      : "";
    const text = await ask(
      `Analyze this legal document for a music management company.
File: "${fileName}" (${mimeType})${contentSection}
Categories: contract, nda, agreement, other

Also determine if this document has been SIGNED. Look for:
- Actual signatures, handwritten or digital (e.g. "/s/ John Doe", signature images, DocuSign completion markers)
- "Signed by", "Executed by", "Agreed and accepted" with names/dates filled in
- Witness signatures, notarization stamps
- Digital signature metadata (DocuSign, Adobe Sign, HelloSign completion indicators)
If the document is a blank template, has empty signature lines, or shows no evidence of execution, it is NOT signed.

Reply with ONLY valid JSON:
{"suggestedTitle":"<professional title>","category":"<contract|nda|agreement|other>","summary":"<1-2 sentence summary for the client>","signed":<true or false>}`,
      300
    );
    if (!text) return null;
    const match = text.match(/\{[\s\S]+?\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (parsed.suggestedTitle && parsed.category && parsed.summary) return parsed;
    return null;
  } catch {
    return null;
  }
}

// --- Note thread tagging ---

interface NoteTagging {
  tags: string[];
  priority: string;
}

export async function tagNoteThread(
  subject: string,
  content: string
): Promise<NoteTagging | null> {
  try {
    const text = await ask(
      `Tag this note thread for a music management company portal.
Subject: "${subject}"
Content: "${content}"
Possible tags: scheduling, legal, financial, creative, administrative, general
Priorities: low, normal, high

Reply with ONLY valid JSON:
{"tags":["tag1","tag2"],"priority":"<low|normal|high>"}`,
      100
    );
    if (!text) return null;
    const match = text.match(/\{[\s\S]+?\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed.tags) && parsed.priority) return parsed;
    return null;
  } catch {
    return null;
  }
}

// --- Schedule event suggestions ---

interface EventSuggestion {
  description: string;
  location: string;
}

export async function suggestEventDetails(
  title: string,
  type: string,
  clientName: string
): Promise<EventSuggestion | null> {
  try {
    const text = await ask(
      `Suggest details for this calendar event at a music management company.
Title: "${title}"
Type: ${type}
Client: ${clientName}

Reply with ONLY valid JSON:
{"description":"<brief description>","location":"<suggested location or empty string>"}`,
      100
    );
    if (!text) return null;
    const match = text.match(/\{[\s\S]+?\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (typeof parsed.description === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

// --- Royalty statement analysis ---

interface RoyaltyAnalysis {
  title: string;
  category: "recording" | "publishing";
  source: string;
  period: string;
  amount: number | null;
}

export async function analyzeRoyaltyStatement(
  fileName: string,
  pdfText: string
): Promise<RoyaltyAnalysis | null> {
  try {
    // Truncate PDF text to avoid token limits
    const truncated = pdfText.slice(0, 4000);
    const text = await ask(
      `Analyze this royalty statement for a music management company.

File name: "${fileName}"

Extracted text from the document:
"""
${truncated}
"""

Determine:
1. "title" — a clean, descriptive title (e.g. "TuneCore Q4 2025 Statement")
2. "category" — "recording" if it's from a distributor (TuneCore, DistroKid, CD Baby, EMPIRE, UnitedMasters, Stem, AWAL, etc.) or "publishing" if it's from a PRO (BMI, ASCAP, SESAC, SOCAN, etc.)
3. "source" — the specific platform/organization (e.g. "TuneCore", "BMI", "DistroKid")
4. "period" — the time period covered (e.g. "Q4 2025", "Jan-Mar 2025", "2025")
5. "amount" — the total royalty amount in USD as a number, or null if unclear

Reply with ONLY valid JSON:
{"title":"...","category":"recording|publishing","source":"...","period":"...","amount":number|null}`,
      300
    );
    if (!text) return null;
    const match = text.match(/\{[\s\S]+?\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (parsed.title && parsed.category && parsed.source) return parsed;
    return null;
  } catch {
    return null;
  }
}

// --- Expense classification ---

interface ExpenseClassification {
  category: string;
}

export async function classifyExpense(
  description: string,
  amount: number
): Promise<ExpenseClassification | null> {
  try {
    const text = await ask(
      `Categorize this expense for a music management company.
Description: "${description}"
Amount: $${amount}
Categories: travel, equipment, meals, studio, marketing, other

Reply with ONLY valid JSON:
{"category":"<travel|equipment|meals|studio|marketing|other>"}`,
      50
    );
    if (!text) return null;
    const match = text.match(/\{[^}]+\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (parsed.category) return parsed;
    return null;
  } catch {
    return null;
  }
}
