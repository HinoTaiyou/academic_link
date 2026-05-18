"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ProjectCardItem = {
  id: string;
  name: string;
  description: string;
  pinned: boolean;
  updatedAt: string;
  docTitle: string | null;
  docSummary: string | null;
  docTags: string[];
  figureCount: number;
};

type Props = {
  items: ProjectCardItem[];
  showHeader?: boolean;
};

export function ProjectDashboardSection({ items, showHeader = true }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialTag = searchParams?.get("tag") ?? null;
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag);

  useEffect(() => {
    // keep state in sync when user navigates via back/forward
    setSelectedTag(searchParams?.get("tag") ?? null);
  }, [searchParams]);

  const { allTags, tagCounts, sortedTags } = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((it) =>
      it.docTags.forEach((t) => {
        const k = t.replace(/^#/, "");
        counts[k] = (counts[k] || 0) + 1;
      })
    );
    const tags = Object.keys(counts);
    const sorted = tags.sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
    return { allTags: tags, tagCounts: counts, sortedTags: sorted };
  }, [items]);

  const filtered = useMemo(() => {
    if (!selectedTag) return items;
    return items.filter((it) => it.docTags.map((t) => t.replace(/^#/, "")).includes(selectedTag));
  }, [items, selectedTag]);

  const handleTagClick = useCallback(
    (tag: string) => {
      const next = selectedTag === tag ? null : tag;
      setSelectedTag(next);
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (next) params.set("tag", next);
      else params.delete("tag");
      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    },
    [pathname, router, searchParams, selectedTag]
  );

  const TOP_N = 5;
  const [showAllModal, setShowAllModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="space-y-3">
      {showHeader && (
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">📁 プロジェクトダッシュボード</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              研究の要点と最新資料をカードで確認し、すぐに追加作業へ移動できます。
            </p>
          </div>
          <Link
            href="/research/new"
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#667eea]/40 hover:text-[#667eea]"
          >
            ＋ 研究を追加
          </Link>
        </div>
      )}

      {/* tag quick bar (top N popular) */}
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {sortedTags.length === 0 ? (
            <span className="text-xs text-slate-400">タグはまだありません</span>
          ) : (
            sortedTags.slice(0, TOP_N).map((t) => {
              const active = selectedTag === t;
              return (
                <button
                  key={t}
                  onClick={() => handleTagClick(t)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-[#667eea] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  #{t} {tagCounts[t] ? `(${tagCounts[t]})` : null}
                </button>
              );
            })
          )}
        </div>
        {sortedTags.length > TOP_N ? (
          <button
            onClick={() => setShowAllModal(true)}
            className="ml-auto rounded-md px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
          >
            もっと見る
          </button>
        ) : null}
      </div>

      {/* all-tags modal */}
      {showAllModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowAllModal(false)}
          />
          <div className="z-10 max-h-[80vh] w-[min(900px,95%)] overflow-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">全てのタグ</h3>
              <button
                onClick={() => setShowAllModal(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                閉じる
              </button>
            </div>
            <div className="mt-4">
              <input
                ref={(el) => (searchInputRef.current = el)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="タグ名で検索（部分一致）"
                className="w-full rounded-md border px-3 py-2 text-sm placeholder:text-slate-400"
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {/** filter tags by query (case-insensitive) and sort by count desc **/}
              {(() => {
                const q = searchQuery.trim().toLowerCase();
                const base = q
                  ? sortedTags.filter((t) => t.toLowerCase().includes(q))
                  : sortedTags;
                const visible = base.sort((a, b) => (tagCounts[b] || 0) - (tagCounts[a] || 0));
                return visible.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      handleTagClick(t);
                      setShowAllModal(false);
                      setSearchQuery("");
                    }}
                    className="rounded-md border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    #{t} <span className="ml-2 text-xs text-slate-400">{tagCounts[t]}</span>
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white/50 p-4 text-sm text-muted-foreground">
          プロジェクトが見つかりません。別のタグを試してください。
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={`/projects/${item.id}`}
              className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#667eea]/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                  {item.name}
                </h3>
                {item.pinned ? <span className="text-xs text-violet-600">📌</span> : null}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[11px] font-semibold text-slate-600">プロジェクト概要</p>
                <p className="mt-1 line-clamp-3 text-xs font-medium text-slate-800">
                  {item.description ?? item.docSummary ?? "説明は未設定です。"}
                </p>
              </div>

              <div className="flex min-h-7 flex-wrap gap-1.5">
                {item.docTags.slice(0, 4).map((t) => (
                  <button
                    key={`${item.id}-${t}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTagClick(t.replace(/^#/, ""));
                    }}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition ${
                      selectedTag === t.replace(/^#/, "")
                        ? "bg-[#4457d6] text-white"
                        : "bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white"
                    }`}
                  >
                    #{t.replace(/^#/, "")}
                  </button>
                ))}
                {item.docTags.length === 0 ? (
                  <span className="text-[11px] text-slate-400">タグ未設定</span>
                ) : null}
              </div>

              <div className="mt-auto flex items-center justify-between pt-1 text-[11px] text-slate-500">
                <span>図表メモ {item.figureCount}件</span>
                <span>{formatDate(item.updatedAt)}</span>
              </div>
              <div className="flex items-center justify-end">
                <span className="text-xs font-medium text-[#667eea]">詳細を見る →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "更新日不明";
  return d.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
}
