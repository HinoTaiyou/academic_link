import { GoogleGenerativeAI } from "@google/generative-ai";

export type ResearchDraft = {
  title: string;
  summary: string;
  tags: string[];
};

const MODEL = "gemini-2.5-flash";
const MAX_INPUT_CHARS = 4000;

function getModelClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY が設定されていません。.env.local に追加してください。",
    );
  }

  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });
}

export async function analyzeResearchText(rawText: string): Promise<ResearchDraft> {
  const text = rawText.trim().slice(0, MAX_INPUT_CHARS);
  if (text.length === 0) {
    throw new Error("解析するテキストが空です。");
  }

  const prompt = `次の研究テキストを解析し、JSON だけを出力してください。コードフェンスや前置きは不要です。

形式:
{
  "title": "研究タイトル（推測。なければ内容から短く生成）",
  "summary": "120〜200文字程度の日本語要約（読み手は学部生〜大学院生）",
  "tags": ["#技術や分野のタグ", "..."]
}

制約:
- tags は 3〜6 個、日本語でもよい。先頭の '#' は任意。
- 個人情報・URL・著者名・所属の繰り返しは要約に含めない。

テキスト:
"""
${text}
"""`;

  const model = getModelClient();

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  return parseDraft(raw);
}

export async function analyzeResearchPdf(params: {
  pdfBytes: Uint8Array;
  fileName?: string;
  fallbackText?: string;
}): Promise<ResearchDraft> {
  const model = getModelClient();
  const fallback = (params.fallbackText ?? "").trim().slice(0, MAX_INPUT_CHARS);

  const prompt = `あなたは研究内容の整理アシスタントです。与えられた PDF を解析し、JSON だけを出力してください。コードフェンスや前置きは不要です。

形式:
{
  "title": "研究タイトル（推測。なければ内容から短く生成）",
  "summary": "120〜220文字程度の日本語要約。重要なら図・表（Figure/Table）のポイントも1〜2文で含める",
  "tags": ["#技術や分野のタグ", "..."]
}

制約:
- tags は 3〜6 個、日本語でもよい。先頭の '#' は任意。
- 図表の記述は、PDF内の情報に基づく範囲で簡潔に。
- 個人情報・URL・著者名・所属の繰り返しは要約に含めない。
${fallback ? `
補助情報（テキスト抽出結果。欠落があり得る）:
"""
${fallback}
"""
` : ""}`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: "application/pdf",
        data: Buffer.from(params.pdfBytes).toString("base64"),
      },
    },
  ]);

  const raw = result.response.text();
  return parseDraft(raw);
}

function parseDraft(raw: string): ResearchDraft {
  let body = raw.trim();
  const fenced = body.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) body = fenced[1].trim();

  let obj: unknown;
  try {
    obj = JSON.parse(body);
  } catch {
    throw new Error("AI 応答を JSON として解釈できませんでした。");
  }
  if (!obj || typeof obj !== "object") {
    throw new Error("AI 応答が不正な形式でした。");
  }

  const o = obj as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const summary = typeof o.summary === "string" ? o.summary.trim() : "";
  const tagsRaw = Array.isArray(o.tags) ? o.tags : [];
  const tags = tagsRaw
    .map((t) => (typeof t === "string" ? t.replace(/^#/, "").trim() : ""))
    .filter(Boolean)
    .slice(0, 8);

  if (!title && !summary) {
    throw new Error("AI が要約を返しませんでした。テキストが短すぎる可能性があります。");
  }

  return { title, summary, tags };
}
