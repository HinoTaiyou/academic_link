"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Props = {
  myId: string;
  partnerId: string;
};

export function MessageInput({ myId, partnerId }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    const content = inputRef.current?.value.trim();
    if (!content) return;

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("messages").insert({
        from_id: myId,
        to_id: partnerId,
        content,
      });

      if (error) {
        console.error("send message", error);
        return;
      }

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
      className="flex items-end gap-2 border-t border-slate-200 bg-white p-3 sm:p-4"
    >
      <textarea
        ref={inputRef}
        rows={1}
        disabled={isSubmitting}
        placeholder="メッセージを入力…"
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        className="min-h-[2.5rem] max-h-[7.5rem] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#667eea]/40 focus:ring-2 focus:ring-[#667eea]/20 disabled:opacity-60 disabled:cursor-not-allowed"
      />
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-10 shrink-0 bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-4 font-semibold text-white shadow-md hover:shadow-lg hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "送信中…" : "送信"}
      </Button>
    </form>
  );
}
