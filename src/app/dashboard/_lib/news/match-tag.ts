import { tagKeywordsMap } from "./tag-keywords";

/**
 * Google News の検索クエリ用。
 * 1文字・短い記号だけだと車名「ワゴンR」などに誤爆するので言い換える。
 */
export function expandTagForNewsSearch(tag: string): string {
  const t = tag.replace(/^#/, "").trim();
  const map: Record<string, string> = {
    R: "R言語",
    SQL: "SQL",
  };
  return map[t] ?? t;
}

/**
 * 記事テキストに「その DS タグが本当に言及されているか」。
 * - タグごとの同義語（tagKeywordsMap）を優先
 * - 英単語の短い別名（py, sql など）は単語境界でマッチ（誤爆抑制）
 */
export function articleMentionsTag(tag: string, titleAndDesc: string): boolean {
  const text = titleAndDesc.toLowerCase();
  const clean = tag.replace(/^#/, "").trim();

  const synonyms = tagKeywordsMap[clean];
  const keywords =
    synonyms && synonyms.length > 0 ? synonyms : [clean];

  return keywords.some((kw) => keywordMatches(text, kw.toLowerCase()));
}

function keywordMatches(textLower: string, kw: string): boolean {
  if (!kw) return false;

  // 日本語キーワード・複合語は部分一致でよい
  if (/[\u3040-\u30ff\u3400-\u9fff]/.test(kw) || kw.includes(" ")) {
    return textLower.includes(kw);
  }

  // 短い英略語は単語境界（「wagon r」の r にマッチさせない）
  if (kw.length <= 4 && /^[a-z0-9]+$/i.test(kw)) {
    try {
      return new RegExp(`\\b${escapeRegExp(kw)}\\b`, "i").test(textLower);
    } catch {
      return textLower.includes(kw);
    }
  }

  return textLower.includes(kw);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
