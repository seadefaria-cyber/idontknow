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
}

export async function analyzeLegalDocument(
  fileName: string,
  mimeType: string
): Promise<LegalAnalysis | null> {
  try {
    const text = await ask(
      `Analyze this legal document for a music management company.
File: "${fileName}" (${mimeType})
Categories: contract, nda, agreement, other

Reply with ONLY valid JSON:
{"suggestedTitle":"<professional title>","category":"<contract|nda|agreement|other>","summary":"<1-2 sentence summary for the client>"}`,
      200
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
