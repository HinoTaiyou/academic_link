"use client";

import Link from "next/link";
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

export function ProjectDashboardSection({
  items,
  showHeader = true,
  compact = false,
}: Props) {
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

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--al-border)] bg-[var(--al-surface)] p-4 text-sm text-[var(--al-muted)]">
          プロジェクトがまだありません。研究登録画面から最初のプロジェクトを作成してください。
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
          {items.map((item, index) => (
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
