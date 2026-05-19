import { Newspaper, Sparkles, TrendingUp } from "lucide-react";
import type { NewsItem } from "../_lib/news";
import { NewsCard } from "./news-card";
import { cn } from "@/lib/utils";

type Variant = "interest" | "popular";

type Props = {
  variant: Variant;
  title: string;
  description?: string;
  emptyHint?: string;
  items: NewsItem[];
  interestTags?: string[];
};

const VARIANT_META: Record<
  Variant,
  { icon: typeof Sparkles; eyebrow: string }
> = {
  interest: { icon: Sparkles, eyebrow: "For you" },
  popular: { icon: TrendingUp, eyebrow: "Trending" },
};

export function NewsSection({
  variant,
  title,
  description,
  emptyHint,
  items,
  interestTags = [],
}: Props) {
  const { icon: Icon, eyebrow } = VARIANT_META[variant];
  const [featured, ...rest] = items;

  return (
    <section className="al-glass-card overflow-hidden">
      <div className="border-b border-[var(--al-border)] bg-[linear-gradient(135deg,var(--al-accent-soft)_0%,#fff_55%)] px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--al-accent)] shadow-sm ring-1 ring-[var(--al-border)]">
            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="al-section-eyebrow">{eyebrow}</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-[var(--al-ink)] sm:text-xl">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-[var(--al-muted)]">
                {description}
              </p>
            ) : null}
            {variant === "interest" && interestTags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {interestTags.slice(0, 8).map((t) => (
                  <span key={t} className="al-tag-pill">
                    #{t.replace(/^#/, "")}
                  </span>
                ))}
                {interestTags.length > 8 ? (
                  <span className="self-center text-xs text-[var(--al-muted)]">
                    +{interestTags.length - 8}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--al-border)] bg-[var(--al-surface)] px-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--al-muted)] ring-1 ring-[var(--al-border)]">
              <Newspaper className="h-6 w-6" strokeWidth={1.5} aria-hidden />
            </span>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--al-muted)]">
              {emptyHint ?? "現在表示できる記事がありません。"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {featured ? (
              <NewsCard item={featured} featured />
            ) : null}
            {rest.length > 0 ? (
              <div
                className={cn(
                  "grid gap-3",
                  rest.length >= 2 ? "sm:grid-cols-2" : "grid-cols-1",
                )}
              >
                {rest.map((item) => (
                  <NewsCard key={item.url} item={item} />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
