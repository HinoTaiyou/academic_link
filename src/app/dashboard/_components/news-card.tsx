import { ArrowUpRight } from "lucide-react";
import type { NewsItem } from "../_lib/news";
import { cn } from "@/lib/utils";

type Props = {
  item: NewsItem;
  featured?: boolean;
};

export function NewsCard({ item, featured = false }: Props) {
  const titleText = normalizeNewsPlainText(item.title);
  const snippet = normalizeNewsPlainText(item.description);
  const displaySnippet = snippet || "\u00a0";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex h-full w-full min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--al-border)] bg-white transition-all",
        "hover:border-[color-mix(in_srgb,var(--al-accent)_35%,var(--al-border))] hover:shadow-[0_8px_28px_-8px_rgba(201,107,74,0.15)]",
        featured ? "min-h-[9.5rem] sm:min-h-[9rem] sm:flex-row sm:gap-0" : "min-h-[13.5rem]",
      )}
    >
      <span
        className="absolute inset-y-0 left-0 w-1 bg-[var(--al-accent)] opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />

      <div
        className={cn(
          "flex flex-1 flex-col gap-3 p-4 sm:p-5",
          featured && "sm:pr-4",
        )}
      >
        {item.publishedAt ? (
          <time
            dateTime={item.publishedAt}
            className="text-[11px] text-[var(--al-muted)]"
          >
            {formatPublishedAt(item.publishedAt)}
          </time>
        ) : null}

        <h3
          className={cn(
            "line-clamp-3 min-h-[3.75rem] font-semibold leading-snug text-[var(--al-ink)] transition-colors group-hover:text-[var(--al-accent)]",
            featured ? "text-base sm:text-lg sm:min-h-[4.25rem]" : "text-sm",
          )}
        >
          {titleText}
        </h3>

        <p
          className={cn(
            "line-clamp-3 min-h-[3.75rem] leading-relaxed text-[var(--al-muted)]",
            featured ? "text-sm" : "text-xs",
            !snippet && "text-transparent select-none",
          )}
          aria-hidden={!snippet}
        >
          {displaySnippet}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {item.relatedTags.slice(0, featured ? 5 : 3).map((t) => (
              <span key={t} className="al-tag-pill">
                #{t.replace(/^#/, "")}
              </span>
            ))}
          </div>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-[var(--al-accent)] opacity-0 transition-opacity group-hover:opacity-100">
            読む
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </span>
        </div>
      </div>

      {featured ? (
        <div
          className="hidden w-28 shrink-0 bg-[linear-gradient(160deg,var(--al-accent-soft)_0%,#fff_70%)] sm:block"
          aria-hidden
        />
      ) : null}
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
