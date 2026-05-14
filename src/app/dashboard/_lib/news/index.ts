import { dsProgrammingTags } from "@/lib/constants/profile";
import { articleMentionsTag, expandTagForNewsSearch } from "./match-tag";
import { fetchRss, type RawRssItem } from "./rss";
import type { NewsItem } from "./types";

export type { NewsItem } from "./types";

const REVALIDATE_SECONDS = 60 * 30; // 30 分キャッシュ

/**
 * 興味タグから Google News を検索（app.py の get_news_for_interests 相当）
 *
 * - 検索語は短いタグ（特に R）を言い換えて誤爆を減らす
 * - 返す記事は「どれかのタグがキーワードルールで実際に言及されている」ものだけに絞る
 */
export async function getNewsForInterests(
  interestsRaw: string[],
  limit = 10,
): Promise<NewsItem[]> {
  const interests = interestsRaw
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);
  if (interests.length === 0) return [];

  const query = interests.map(expandTagForNewsSearch).join(" OR ");
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
    query,
  )}&hl=ja&gl=JP&ceid=JP:ja`;

  const items = await fetchRss(rssUrl, REVALIDATE_SECONDS);

  const blobOf = (e: RawRssItem) => `${e.title} ${e.description}`;

  const filtered = items.filter((entry) =>
    interests.some((tag) => articleMentionsTag(tag, blobOf(entry))),
  );

  return filtered.slice(0, limit).map((entry) =>
    toNewsItem(entry, "📰", () => {
      const blob = blobOf(entry);
      const matched: string[] = [];
      for (const tag of interests) {
        if (articleMentionsTag(tag, blob) && !matched.includes(`#${tag}`)) {
          matched.push(`#${tag}`);
        }
      }
      return matched;
    }),
  );
}

/**
 * Google News のテクノロジーセクションから人気記事を取得
 * （app.py の get_popular_news 相当）
 */
export async function getPopularNews(
  excludeInterestsRaw: string[] = [],
  limit = 5,
): Promise<NewsItem[]> {
  const excludeSet = new Set(
    excludeInterestsRaw.map((t) => t.replace(/^#/, "").trim()).filter(Boolean),
  );

  const rssUrl =
    "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=ja&gl=JP&ceid=JP:ja";
  const items = await fetchRss(rssUrl, REVALIDATE_SECONDS);

  return items.slice(0, limit).map((entry) =>
    toNewsItem(entry, "🔥", () =>
      detectRelatedTags(entry, excludeSet),
    ),
  );
}

function detectRelatedTags(
  entry: RawRssItem,
  excludeSet: Set<string>,
): string[] {
  const blob = `${entry.title} ${entry.description}`;
  const matched: string[] = [];

  for (const tag of dsProgrammingTags) {
    if (excludeSet.has(tag)) continue;
    if (articleMentionsTag(tag, blob) && !matched.includes(`#${tag}`)) {
      matched.push(`#${tag}`);
    }
  }

  if (matched.length === 0) {
    let count = 0;
    for (const tag of dsProgrammingTags) {
      if (excludeSet.has(tag)) continue;
      matched.push(`#${tag}`);
      count += 1;
      if (count >= 3) break;
    }
  }

  return matched;
}

function toNewsItem(
  entry: RawRssItem,
  icon: string,
  buildTags: () => string[],
): NewsItem {
  return {
    title: entry.title,
    description: entry.description,
    url: entry.link,
    source: entry.source ?? "Google News",
    publishedAt: entry.pubDate
      ? new Date(entry.pubDate).toISOString()
      : null,
    relatedTags: buildTags(),
    icon,
  };
}
