"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MessageBubble, type MessageData } from "./message-bubble";
import { MessageInput } from "./message-input";
import { markAsReadAction } from "../_lib/actions";

type Props = {
  myId: string;
  partnerId: string;
  initialMessages: MessageData[];
};

export function ChatMessages({ myId, partnerId, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef(new Set(initialMessages.map((m) => m.id)));

  const appendMessage = useCallback((msg: MessageData) => {
    if (seenIds.current.has(msg.id)) return;
    seenIds.current.add(msg.id);
    setMessages((prev) => [...prev, msg]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    markAsReadAction(partnerId);
  }, [partnerId]);

  useEffect(() => {
    const supabase = createClient();
    const channelName = `chat:${myId}:${partnerId}:${Date.now()}`;
    const channel = supabase.channel(channelName);

    // Handle new messages
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => {
        const row = payload.new as any;
        const isRelevant =
          (row.from_id === myId && row.to_id === partnerId) ||
          (row.from_id === partnerId && row.to_id === myId);
        if (!isRelevant) return;
        const msg: MessageData = {
          id: row.id,
          fromId: row.from_id,
          content: row.content,
          createdAt: row.created_at,
          readAt: row.read_at,
        };
        appendMessage(msg);
        if (row.from_id === partnerId) {
          markAsReadAction(partnerId);
        }
      },
    );

    // Handle updates (e.g., read_at changes)
    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages" },
      (payload) => {
        const row = payload.new as any;
        const isRelevant =
          (row.from_id === myId && row.to_id === partnerId) ||
          (row.from_id === partnerId && row.to_id === myId);
        if (!isRelevant) return;

        // If a message we have in state was updated (e.g., read_at set), update it
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === row.id);
          if (idx === -1) return prev;
          const copy = [...prev];
          copy[idx] = { ...copy[idx], readAt: row.read_at };
          return copy;
        });
      },
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, partnerId, appendMessage]);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-5 sm:px-5">
        <div className="mx-auto max-w-3xl space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--al-border)] bg-white/80 px-6 py-14 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--al-accent-soft)] text-[var(--al-accent)]">
                <MessageSquare
                  className="h-5 w-5"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
              <p className="mt-3 text-sm font-medium text-[var(--al-ink)]">
                会話を始めましょう
              </p>
              <p className="mt-1 text-xs text-[var(--al-muted)]">
                下の入力欄から最初のメッセージを送れます
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <MessageBubble key={m.id} message={m} isMe={m.fromId === myId} />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <MessageInput
        myId={myId}
        partnerId={partnerId}
        onMessageSent={appendMessage}
      />
    </>
  );
}
