"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageBubble, type MessageData } from "./message-bubble";
import { markAsReadAction } from "../_lib/actions";

type Props = {
  myId: string;
  partnerId: string;
  initialMessages: MessageData[];
};

export function ChatMessages({ myId, partnerId, initialMessages }: Props) {
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark unread messages as read on mount
  useEffect(() => {
    markAsReadAction(partnerId);
  }, [partnerId]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            from_id: string;
            to_id: string;
            content: string;
            created_at: string;
            read_at: string | null;
          };

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

          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });

          if (row.from_id === partnerId) {
            markAsReadAction(partnerId);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, partnerId]);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-3">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            まだメッセージがありません。最初のメッセージを送ってみましょう。
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} isMe={m.fromId === myId} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
