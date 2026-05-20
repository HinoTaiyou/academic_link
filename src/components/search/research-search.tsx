"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Post = { id: string; title: string; summary: string | null; created_at: string };

export default function ResearchSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Post[] | null>(null);
  const [loading, setLoading] = useState(false);

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
        />
        <Button size="sm" onClick={() => void doSearch()} disabled={loading || q.trim() === ""}>
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
                <h3 className="font-semibold">{r.title}</h3>
                <p className="text-sm text-gray-600">{r.summary}</p>
                <div className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
