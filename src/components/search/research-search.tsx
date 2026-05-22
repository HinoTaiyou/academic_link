"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type ResearchPost = {
  id: string;
  title: string;
  summary: string | null;
  created_at: string;
};

type ProjectResult = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

type SearchResults = {
  researchPosts: ResearchPost[];
  projects: ProjectResult[];
};

export default function ResearchSearch() {
  const [q, setQ] = useState("");
  const [randSearchName] = useState(() => "research_q_" + Math.random().toString(36).slice(2, 8));
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  async function doSearch(page = 1) {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/research/search?q=${encodeURIComponent(q)}&page=${page}`);
      const json = await res.json();
      setResults({
        researchPosts: json.researchPosts ?? [],
        projects: json.projects ?? [],
      });
    } catch (err) {
      console.error(err);
      setResults({ researchPosts: [], projects: [] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="検索ワードを入力"
          className="flex-1 rounded border px-3 py-2"
          name={randSearchName}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-autocomplete="none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isComposing) {
              e.preventDefault();
              void doSearch();
            }
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
        />
        <Button variant="outline" size="sm" onClick={() => void doSearch()} disabled={loading || q.trim() === ""}>
          {loading ? "検索中…" : "検索"}
        </Button>
      </div>

      <div className="mt-4">
        {results === null ? (
          <p className="text-sm text-gray-500">キーワードを入力して検索してください</p>
        ) : (
          <div className="space-y-6">
            <ResultSection
              title="研究投稿"
              emptyMessage="研究投稿の結果がありません"
              items={results.researchPosts}
              renderItem={(r) => (
                <Link href={`/research/${r.id}`} className="block">
                  <h3 className="font-semibold text-[var(--al-ink)]">{r.title}</h3>
                  <p className="text-sm text-[var(--al-muted)]">{r.summary}</p>
                  <div className="text-xs text-[var(--al-muted)]">{new Date(r.created_at).toLocaleString()}</div>
                </Link>
              )}
            />

            <ResultSection
              title="プロジェクト"
              emptyMessage="プロジェクトの結果がありません"
              items={results.projects}
              renderItem={(p) => (
                <Link href={`/projects/${p.id}`} className="block">
                  <h3 className="font-semibold text-[var(--al-ink)]">{p.name}</h3>
                  <p className="text-sm text-[var(--al-muted)]">{p.description}</p>
                  <div className="text-xs text-[var(--al-muted)]">{new Date(p.created_at).toLocaleString()}</div>
                </Link>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ResultSection<T>({
  title,
  emptyMessage,
  items,
  renderItem,
}: {
  title: string;
  emptyMessage: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-[var(--al-ink)]">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="rounded border p-3">
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
