import type { NewsItem } from "../_lib/news";

type Props = {
  item: NewsItem;
};

export function NewsCard({ item }: Props) {
  const titleText = normalizeNewsPlainText(item.title);
  const snippet = normalizeNewsPlainText(item.description);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full min-h-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#667eea]/40 hover:shadow-md sm:p-5"
    >
      <div className="flex min-h-0 items-start gap-3">
        <span aria-hidden className="mt-0.5 shrink-0 text-2xl leading-none">
          {item.icon}
        </span>
        <h3 className="line-clamp-3 text-sm font-semibold leading-snug text-slate-900 group-hover:text-[#667eea]">
          {titleText}
        </h3>
      </div>

      {snippet ? (
        <p className="line-clamp-3 text-xs leading-relaxed text-slate-600">
          {snippet}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {item.relatedTags.slice(0, 4).map((t) => (
          <span
            key={t}
            className="rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-2.5 py-0.5 text-[11px] font-medium text-white"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span className="truncate">{item.source}</span>
        {item.publishedAt ? (
          <time dateTime={item.publishedAt} className="shrink-0">
            {formatPublishedAt(item.publishedAt)}
          </time>
        ) : null}
      </div>
    </a>
  );
}

/** RSS/HTML 由来のテキストを画面表示用に整形（タグ除去・エンティティデコード・空白整理） */
function normalizeNewsPlainText(raw: string): string {
  const noTags = raw.replace(/<[^>]*>/g, " ");
  const decoded = decodeHtmlEntities(noTags);
  return decoded.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(input: string): string {
  let s = input;
  s = s.replace(/&#x([0-9a-f]{1,8});/gi, (full, hex: string) => {
    const cp = parseInt(hex, 16);
    if (!Number.isFinite(cp) || cp < 0) return full;
    try {
      return String.fromCodePoint(cp);
    } catch {
      return full;
    }
  });
  s = s.replace(/&#(\d{1,8});/g, (full, dec: string) => {
    const cp = Number(dec);
    if (!Number.isFinite(cp) || cp < 0) return full;
    try {
      return String.fromCodePoint(cp);
    } catch {
      return full;
    }
  });
  const named: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    hellip: "…",
    mdash: "—",
    ndash: "–",
  };
  s = s.replace(/&([a-z]{2,32});/gi, (full, name: string) => {
    const v = named[name.toLowerCase()];
    return v !== undefined ? v : full;
  });
  return s;
}

function formatPublishedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = Date.now();
  const diffMin = Math.round((now - date.getTime()) / 60_000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin} 分前`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} 時間前`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `${diffD} 日前`;
  return date.toLocaleDateString("ja-JP");
}
