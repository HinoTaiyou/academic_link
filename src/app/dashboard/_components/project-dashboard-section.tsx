import Link from "next/link";

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
};

export function ProjectDashboardSection({ items }: Props) {
  return (
    <section className="space-y-3">
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

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white/50 p-4 text-sm text-muted-foreground">
          プロジェクトがまだありません。研究登録画面から最初のプロジェクトを作成してください。
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/research/new?projectId=${item.id}`}
              className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#667eea]/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                  {item.name}
                </h3>
                {item.pinned ? <span className="text-xs text-violet-600">📌</span> : null}
              </div>

              {item.description ? (
                <p className="line-clamp-2 text-xs text-slate-600">{item.description}</p>
              ) : (
                <p className="text-xs text-slate-400">説明は未設定です。</p>
              )}

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[11px] font-semibold text-slate-600">最新の研究あらすじ</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-800">
                  {item.docTitle ?? "まだ資料がありません"}
                </p>
                <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-slate-600">
                  {item.docSummary ?? "このプロジェクトに資料を追加すると、ここにAI要約が表示されます。"}
                </p>
              </div>

              <div className="flex min-h-7 flex-wrap gap-1.5">
                {item.docTags.slice(0, 4).map((t) => (
                  <span
                    key={`${item.id}-${t}`}
                    className="rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-2 py-0.5 text-[10px] font-medium text-white"
                  >
                    #{t.replace(/^#/, "")}
                  </span>
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
                <span className="text-xs font-medium text-[#667eea]">
                  このプロジェクトに追加 →
                </span>
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
