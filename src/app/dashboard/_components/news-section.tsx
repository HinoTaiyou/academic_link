import type { NewsItem } from "../_lib/news";
import { NewsCard } from "./news-card";

type Props = {
  title: string;
  description?: string;
  emptyHint?: string;
  items: NewsItem[];
};

export function NewsSection({ title, description, emptyHint, items }: Props) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white/50 p-4 text-sm text-muted-foreground">
          {emptyHint ?? "現在表示できる記事がありません。"}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <NewsCard key={item.url} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
