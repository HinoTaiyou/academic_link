import { getResearchPdfSignedUrl } from "../_lib/actions";

export type ResearchListItem = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  file_name: string | null;
  pdf_path: string | null;
  created_at: string;
};

type Props = {
  items: ResearchListItem[];
  /** 自分の一覧か（PDF ダウンロードリンクを出す判断に使う） */
  isOwner: boolean;
};

export async function ResearchList({ items, isOwner }: Props) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-sm text-muted-foreground">
        {isOwner
          ? "まだ研究が登録されていません。サイドバーの「📝 研究を登録」から追加できます。"
          : "このメンバーが公開した研究はまだありません。"}
      </p>
    );
  }

  const signedMap = new Map<string, string>();
  await Promise.all(
    items.map(async (it) => {
      if (!it.pdf_path) return;
      const url = await getResearchPdfSignedUrl(it.pdf_path);
      if (url) signedMap.set(it.id, url);
    }),
  );

  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li
          key={it.id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              {it.title}
            </h3>
            <time
              dateTime={it.created_at}
              className="shrink-0 text-[11px] text-slate-400"
            >
              {formatDate(it.created_at)}
            </time>
          </div>

          {it.summary ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {it.summary}
            </p>
          ) : null}

          {it.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {it.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-[#667eea] ring-1 ring-violet-200"
                >
                  #{t.replace(/^#/, "")}
                </span>
              ))}
            </div>
          ) : null}

          {it.pdf_path && signedMap.get(it.id) ? (
            <div className="mt-4 flex items-center gap-3 text-xs">
              <a
                href={signedMap.get(it.id)!}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#667eea] hover:underline"
              >
                📎 {it.file_name ?? "添付PDFを開く"}
              </a>
              <span className="text-slate-400">（リンクは10分間有効）</span>
            </div>
          ) : it.pdf_path && it.file_name ? (
            <p className="mt-4 text-[11px] text-slate-400">
              📎 {it.file_name}（PDF の取得に失敗しました）
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
