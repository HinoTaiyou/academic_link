"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProfileProjectCard } from "../_lib/load-profile-projects";
import { ResearchQaModal, type QaMessage, type QaSession } from "./research-qa-modal";

type Props = {
  items: ProfileProjectCard[];
  authorName: string;
};

function toSession(item: ProfileProjectCard): QaSession | null {
  if (item.qaResearchPostId) {
    return {
      sessionKey: `post:${item.qaResearchPostId}`,
      title: item.docTitle ?? item.name,
      researchPostId: item.qaResearchPostId,
    };
  }
  if (item.qaProjectId) {
    return {
      sessionKey: `project:${item.qaProjectId}`,
      title: item.docTitle ?? item.name,
      projectId: item.qaProjectId,
    };
  }
  return null;
}

export function ProjectDashboardBrowse({ items, authorName }: Props) {
  const [session, setSession] = useState<QaSession | null>(null);
  const [histories, setHistories] = useState<Record<string, QaMessage[]>>({});
  const nextIdRef = useRef(1);

  const nextMessageId = useCallback(() => nextIdRef.current++, []);

  const handleMessagesChange = useCallback(
    (key: string, updater: (prev: QaMessage[]) => QaMessage[]) => {
      setHistories((prev) => ({ ...prev, [key]: updater(prev[key] ?? []) }));
    },
    [],
  );

  const messages = session ? (histories[session.sessionKey] ?? []) : [];

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-white/50 p-4 text-sm text-muted-foreground">
        このメンバーはまだ研究プロジェクトを公開していません。
      </p>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const qa = toSession(item);
          return (
            <article
              key={item.id}
              className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                  {item.name}
                </h3>
                {item.pinned ? (
                  <span className="text-xs text-violet-600">📌</span>
                ) : null}
              </div>

              {item.description ? (
                <p className="line-clamp-2 text-xs text-slate-600">
                  {item.description}
                </p>
              ) : (
                <p className="text-xs text-slate-400">説明は未設定です。</p>
              )}

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[11px] font-semibold text-slate-600">
                  最新の研究あらすじ
                </p>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-800">
                  {item.docTitle ?? "まだ資料がありません"}
                </p>
                <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-slate-600">
                  {item.docSummary ??
                    "このプロジェクトに資料が追加されると、ここに要約が表示されます。"}
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

              {qa ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSession(qa)}
                  className="w-full border-violet-200 text-[#667eea] hover:border-[#667eea]/50 hover:bg-violet-50"
                >
                  💬 この研究について質問
                </Button>
              ) : (
                <p className="text-center text-[11px] text-slate-400">
                  質問できる公開テキストがありません
                </p>
              )}
            </article>
          );
        })}
      </div>

      <ResearchQaModal
        open={session !== null}
        onClose={() => setSession(null)}
        session={session}
        authorName={authorName}
        messages={messages}
        onMessagesChange={handleMessagesChange}
        nextMessageId={nextMessageId}
      />
    </>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "更新日不明";
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}
