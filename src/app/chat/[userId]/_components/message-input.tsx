"use client";

import { useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { MessageData } from "./message-bubble";

type Props = {
  myId: string;
  partnerId: string;
  onMessageSent?: (msg: MessageData) => void;
};

export function MessageInput({ myId, partnerId, onMessageSent }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    const content = inputRef.current?.value.trim();
    if (!content) return;

    setIsSubmitting(true);
    setSendError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("messages")
        .insert({
          from_id: myId,
          to_id: partnerId,
          content,
        })
        .select("id, from_id, to_id, content, created_at, read_at")
        .maybeSingle();

      if (error) {
        console.error("send message", error);
        setSendError(error.message || "送信に失敗しました。");
        return;
      }

      if (!data) {
        setSendError(
          "保存はされたかもしれませんが、返却データを取得できませんでした。ページを再読み込みするか、しばらく待ってください。",
        );
        return;
      }

      onMessageSent?.({
        id: data.id as string,
        fromId: data.from_id as string,
        content: data.content as string,
        createdAt: data.created_at as string,
        readAt: (data.read_at as string | null) ?? null,
      });

      if (inputRef.current) {
        inputRef.current.value = "";
        inputRef.current.style.height = "auto";
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-[var(--al-border)] bg-white/95 px-3 py-3 backdrop-blur sm:px-5 sm:py-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        {sendError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {sendError}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            disabled={isSubmitting}
            placeholder="メッセージを入力…"
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            className="al-auth-input min-h-11 max-h-[7.5rem] flex-1 resize-none py-2.5 shadow-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="al-btn-gradient inline-flex h-11 shrink-0 items-center justify-center gap-1.5 px-4 text-sm disabled:opacity-60"
            aria-label="送信"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            )}
            <span className="hidden sm:inline">
              {isSubmitting ? "送信中" : "送信"}
            </span>
          </button>
        </div>
        <p className="hidden text-center text-[10px] text-[var(--al-muted)] sm:block">
          Enter で送信 · Shift + Enter で改行
        </p>
      </div>
    </form>
  );
}
