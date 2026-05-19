"use client";

import { useCallback, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { FolderCard } from "@/components/projects/folder-card";
import { cn } from "@/lib/utils";
import type { ProfileProjectCard } from "../_lib/load-profile-projects";
import { ResearchQaModal, type QaMessage, type QaSession } from "./research-qa-modal";

type Props = {
  items: ProfileProjectCard[];
  authorName: string;
  compact?: boolean;
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

export function ProjectDashboardBrowse({
  items,
  authorName,
  compact = true,
}: Props) {
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
      <p className="rounded-xl border border-dashed border-[var(--al-border)] bg-[var(--al-surface)] p-4 text-sm text-[var(--al-muted)]">
        このメンバーはまだ研究プロジェクトを公開していません。
      </p>
    );
  }

  const folderSize = compact ? "sm" : "md";

  return (
    <>
      <div
        className={cn(
          "grid w-full gap-4 overflow-visible pt-1 sm:gap-5",
          compact
            ? "grid-cols-2 sm:grid-cols-2"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
        )}
      >
        {items.map((item, index) => {
          const qa = toSession(item);
          const href = item.viewHref ?? undefined;
          const fileCount = Math.max(
            item.fileCount ?? 0,
            item.docSummary ? 1 : 0,
          );

          return (
            <FolderCard
              key={item.id}
              layout="tile"
              index={index}
              title={item.name}
              pinned={item.pinned}
              size={folderSize}
              fileCount={fileCount}
              href={href}
              className="w-full"
              footer={
                qa ? (
                  <button
                    type="button"
                    onClick={() => setSession(qa)}
                    className="al-folder-tile-qa"
                  >
                    <MessageSquare
                      className="h-3.5 w-3.5 shrink-0"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    この研究について質問
                  </button>
                ) : (
                  <p className="rounded-xl bg-white/60 px-2 py-2 text-center text-[10px] leading-snug text-[var(--al-muted)] ring-1 ring-[var(--al-border)]/80">
                    質問できる公開テキストがありません
                  </p>
                )
              }
            />
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
