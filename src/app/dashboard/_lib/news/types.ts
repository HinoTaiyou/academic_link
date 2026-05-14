export type NewsItem = {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string | null;
  /** ハッシュタグ表記済み (例: "#機械学習") */
  relatedTags: string[];
  icon: string;
};
