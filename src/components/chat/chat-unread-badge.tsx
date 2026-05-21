"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ChatUnreadBadge() {
  const [count, setCount] = useState<number>(0);

  async function fetchCount() {
    try {
      const res = await fetch("/api/chat/unread");
      if (!res.ok) return;
      const j = await res.json();
      setCount(Number(j.unread_total ?? 0));
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    fetchCount();
    const iv = setInterval(fetchCount, 15_000);
    return () => clearInterval(iv);
  }, []);

  if (!count) return null;
  return (
    <Link href="/chat" className="inline-flex items-center gap-2">
      <span className="text-sm text-[var(--al-muted)]">DM</span>
      <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[var(--al-accent)] px-2 text-sm font-semibold text-white">
        {count > 99 ? "99+" : count}
      </span>
    </Link>
  );
}
