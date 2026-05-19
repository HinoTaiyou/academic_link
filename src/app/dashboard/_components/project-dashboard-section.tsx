"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FolderCard } from "@/components/projects/folder-card";
import { cn } from "@/lib/utils";

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
  fileCount: number;
};

type Props = {
  items: ProjectCardItem[];
  showHeader?: boolean;
  /** プロフィール内など — 小さめフォルダ＋タイトなグリッド */
  compact?: boolean;
};

function normalizeTag(tag: string): string {
  return tag.replace(/^#/, "").trim();
}

export function ProjectDashboardSection({
  items,
  showHeader = true,
  compact = false,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const parseSelectedTags = useCallback(() => {
    const params = searchParams ?? new URLSearchParams();
    return Array.from(
      new Set(
        params
          .getAll("tag")
          .map(normalizeTag)
          .filter(Boolean),
      ),
    );
  }, [searchParams]);

  const [selectedTags, setSelectedTags] = useState<string[]>(() =>
    parseSelectedTags(),
  );

  useEffect(() => {
    setSelectedTags(parseSelectedTags());
  }, [parseSelectedTags, searchParams]);

  const { tagCounts, sortedTags } = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((it) =>
      it.docTags.forEach((t) => {
        const k = normalizeTag(t);
        counts[k] = (counts[k] || 0) + 1;
      }),
    );
    const tags = Object.keys(counts);
    const sorted = tags.sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
    return { tagCounts: counts, sortedTags: sorted };
  }, [items]);

  const filtered = useMemo(() => {
    if (selectedTags.length === 0) return items;
    return items.filter((it) => {
      const itemTags = it.docTags.map(normalizeTag);
      return selectedTags.some((tag) => itemTags.includes(tag));
    });
  }, [items, selectedTags]);

  const updateSelectedTags = useCallback(
    (nextTags: string[]) => {
      setSelectedTags(nextTags);
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.delete("tag");
      nextTags.forEach((tag) => params.append("tag", tag));
      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    },
    [pathname, router, searchParams],
  );

  const toggleTag = useCallback(
    (tag: string) => {
      const normalized = normalizeTag(tag);
      const next = selectedTags.includes(normalized)
        ? selectedTags.filter((item) => item !== normalized)
        : [...selectedTags, normalized];
      updateSelectedTags(next);
    },
    [selectedTags, updateSelectedTags],
  );

  const TOP_N = 5;
  const [showAllModal, setShowAllModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (showAllModal) {
      searchInputRef.current?.focus();
    }
  }, [showAllModal]);

  return (
    <section className="space-y-3">
      {showHeader && (
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="al-section-eyebrow">Projects</p>
            <h2 className="text-base font-semibold text-[var(--al-ink)]">
              プロジェクトダッシュボード
            </h2>
            <p className="mt-0.5 text-xs text-[var(--al-muted)]">
              研究の要点と最新資料をカードで確認し、すぐに追加作業へ移動できます。
            </p>
          </div>
          <Link href="/research/new" className="al-btn-outline shrink-0">
            ＋ 研究を追加
          </Link>
        </div>
      )}

      {selectedTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--al-border)] bg-[var(--al-surface)] px-3 py-2">
          <span className="text-[11px] font-semibold text-[var(--al-muted)]">
            選択中
          </span>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="rounded-full bg-[var(--al-accent)] px-3 py-1 text-xs font-medium text-white"
              >
                #{tag} ×
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => updateSelectedTags([])}
            className="ml-auto text-xs text-[var(--al-muted)] hover:text-[var(--al-ink)]"
          >
            すべて解除
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {sortedTags.length === 0 ? (
            <span className="text-xs text-[var(--al-muted)]">
              タグはまだありません
            </span>
          ) : (
            sortedTags.slice(0, TOP_N).map((t) => {
              const active = selectedTags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition",
                    active
                      ? "bg-[var(--al-accent)] text-white"
                      : "bg-[var(--al-surface)] text-[var(--al-ink)] hover:bg-[var(--al-border)]",
                  )}
                >
                  #{t} {tagCounts[t] ? `(${tagCounts[t]})` : null}
                </button>
              );
            })
          )}
        </div>
        {sortedTags.length > TOP_N ? (
          <button
            type="button"
            onClick={() => setShowAllModal(true)}
            className="ml-auto rounded-md px-3 py-1 text-xs text-[var(--al-muted)] hover:bg-[var(--al-surface)]"
          >
            もっと見る
          </button>
        ) : null}
      </div>

      {showAllModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowAllModal(false)}
          />
          <div className="z-10 max-h-[80vh] w-[min(900px,95%)] overflow-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--al-ink)]">
                全てのタグ
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAllModal(false);
                  setSearchQuery("");
                }}
                className="text-xs text-[var(--al-muted)] hover:text-[var(--al-ink)]"
              >
                閉じる
              </button>
            </div>
            <div className="mt-4">
              <input
                ref={(el) => {
                  searchInputRef.current = el;
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="タグ名で検索（部分一致）"
                className="w-full rounded-md border border-[var(--al-border)] px-3 py-2 text-sm placeholder:text-[var(--al-muted)]"
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {(() => {
                const q = searchQuery.trim().toLowerCase();
                const base = q
                  ? sortedTags.filter((t) => t.toLowerCase().includes(q))
                  : sortedTags;
                const visible = base.sort(
                  (a, b) => (tagCounts[b] || 0) - (tagCounts[a] || 0),
                );
                return visible.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm transition",
                      selectedTags.includes(t)
                        ? "border-[var(--al-accent)] bg-[var(--al-surface)] text-[var(--al-accent)]"
                        : "border-[var(--al-border)] text-[var(--al-ink)] hover:bg-[var(--al-surface)]",
                    )}
                  >
                    #{t}{" "}
                    <span className="ml-2 text-xs text-[var(--al-muted)]">
                      {tagCounts[t]}
                    </span>
                  </button>
                ));
              })()}
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <span className="text-xs text-[var(--al-muted)]">
                複数選択できます
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowAllModal(false);
                  setSearchQuery("");
                }}
                className="rounded-md bg-[var(--al-accent)] px-3 py-1.5 text-xs font-medium text-white"
              >
                完了
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--al-border)] bg-[var(--al-surface)] p-4 text-sm text-[var(--al-muted)]">
          プロジェクトがまだありません。研究登録画面から最初のプロジェクトを作成してください。
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--al-border)] bg-[var(--al-surface)] p-4 text-sm text-[var(--al-muted)]">
          プロジェクトが見つかりません。別のタグを試してください。
        </p>
      ) : (
        <div
          className={cn(
            "w-full overflow-visible",
            compact
              ? "grid grid-cols-2 gap-4 pt-1 sm:grid-cols-2 sm:gap-5"
              : "grid grid-cols-2 gap-x-8 gap-y-12 pt-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
          )}
        >
          {filtered.map((item, index) => (
            <FolderCard
              key={item.id}
              layout={compact ? "tile" : "inline"}
              index={index}
              title={item.name}
              pinned={item.pinned}
              size={compact ? "sm" : "md"}
              className={compact ? "w-full" : undefined}
              fileCount={Math.max(
                item.fileCount ?? 0,
                item.docSummary ? 1 : 0,
              )}
              href={`/projects/${item.id}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
