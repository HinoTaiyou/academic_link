"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Post = { id: string; title: string; summary: string | null; created_at: string };

export default function ResearchSearch() {
  const [q, setQ] = useState("");
  const [randSearchName] = useState(() => "research_q_" + Math.random().toString(36).slice(2, 8));
  const [results, setResults] = useState<Post[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  async function doSearch(page = 1) {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/research/search?q=${encodeURIComponent(q)}&page=${page}`);
      const json = await res.json();
      setResults(json.data ?? []);
    } catch (err) {
      console.error(err);
      setResults([]);
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
        ) : results.length === 0 ? (
          <p className="text-sm text-gray-500">結果がありません</p>
        ) : (
          <ul className="space-y-3">
            {results.map((r) => (
              <li key={r.id} className="p-3 border rounded">
                <Link href={`/research/${r.id}`} className="block">
                  <h3 className="font-semibold text-[var(--al-ink)]">{r.title}</h3>
                  <p className="text-sm text-[var(--al-muted)]">{r.summary}</p>
                  <div className="text-xs text-[var(--al-muted)]">{new Date(r.created_at).toLocaleString()}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
