"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export type QaMessage =
  | { id: number; role: "user"; content: string }
  | { id: number; role: "assistant"; content: string };

export type QaSession = {
  sessionKey: string;
  title: string;
  researchPostId?: string;
  projectId?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  session: QaSession | null;
  authorName: string;
  messages: QaMessage[];
  onMessagesChange: (key: string, updater: (prev: QaMessage[]) => QaMessage[]) => void;
  nextMessageId: () => number;
};

export function ResearchQaModal({
  open,
  onClose,
  session,
  authorName,
  messages,
  onMessagesChange,
  nextMessageId,
}: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const close = useCallback(() => {
    onClose();
    dialogRef.current?.close();
  }, [onClose]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setQuestion("");
      setError(null);
    }, 0);
    return () => clearTimeout(t);
  }, [open, session?.sessionKey]);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || loading) return;
    const q = question.trim();
    if (!q) return;

    setLoading(true);
    setError(null);

    const userMsg: QaMessage = {
      id: nextMessageId(),
      role: "user",
      content: q,
    };
    onMessagesChange(session.sessionKey, (prev) => [...prev, userMsg]);
    setQuestion("");

    try {
      const res = await fetch("/api/research/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          ...(session.researchPostId
            ? { researchPostId: session.researchPostId }
            : { projectId: session.projectId }),
        }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "回答の取得に失敗しました。");
      }
      const assistantMsg: QaMessage = {
        id: nextMessageId(),
        role: "assistant",
        content: data.answer ?? "",
      };
      onMessagesChange(session.sessionKey, (prev) => [...prev, assistantMsg]);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "回答の取得に失敗しました。";
      setError(msg);
      onMessagesChange(session.sessionKey, (prev) =>
        prev.filter((m) => m.id !== userMsg.id),
      );
      setQuestion(q);
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) close();
      }}
      className="fixed inset-0 z-50 m-auto hidden h-[min(90vh,640px)] w-[min(96vw,520px)] max-h-none max-w-none flex-col rounded-2xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/40 open:flex"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <h2 id={titleId} className="line-clamp-2 text-sm font-semibold text-slate-900">
            {session?.title ?? "研究について質問"}
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {authorName} さんの研究に関する質問（AI が要約・本文から回答）
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={close}>
          閉じる
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3"
      >
        {messages.length === 0 ? (
          <p className="text-center text-xs text-slate-400">
            研究内容について質問してみてください。
          </p>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-8 rounded-2xl rounded-br-md bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-3 py-2 text-xs text-white"
                : "mr-4 rounded-2xl rounded-bl-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-800"
            }
          >
            {m.content}
          </div>
        ))}
        {loading ? (
          <p className="mr-4 text-xs text-slate-500">回答思考中…</p>
        ) : null}
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-slate-100 px-4 py-3"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例: この研究の目的は何ですか？"
          disabled={loading || !session}
          maxLength={1000}
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#667eea]/30 disabled:opacity-60"
        />
        <Button type="submit" disabled={loading || !session || !question.trim()}>
          送信
        </Button>
      </form>
    </dialog>
  );
}
