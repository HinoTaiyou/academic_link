import { GoogleGenerativeAI } from "@google/generative-ai";

export type ResearchQaContext = {
  authorName: string;
  title: string;
  summary: string;
  tags: string[];
  rawText: string;
};

const MODEL = "gemini-2.5-flash";
const MAX_CONTEXT_CHARS = 6000;

export async function answerResearchQuestion(
  context: ResearchQaContext,
  question: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY が設定されていません。");
  }

  const body = [
    context.summary.trim(),
    context.rawText.trim().slice(0, MAX_CONTEXT_CHARS),
  ]
    .filter(Boolean)
    .join("\n\n");

  const tagLine =
    context.tags.length > 0
      ? `タグ: ${context.tags.map((t) => `#${t.replace(/^#/, "")}`).join(", ")}`
      : "";

  const prompt = `あなたは学術コミュニティ「Academic Link」の研究アシスタントです。
以下の研究について、閲覧者からの質問に日本語で答えてください。

研究者: ${context.authorName}
研究タイトル: ${context.title}
${tagLine}

研究テキスト:
"""
${body}
"""

ルール:
- 上記テキストに書かれている範囲で答える。推測は「推測ですが」と明示する。
- 個人情報の推測、誹謗、研究外の雑談には答えない。
- 箇条書きでも段落でもよい。簡潔に（目安 400 字以内）。

質問:
${question}`;

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: MODEL,
    generationConfig: { temperature: 0.5 },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  if (!text) throw new Error("AI から空の応答が返りました。");
  return text;
}
