"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark } from "lucide-react";

type Props = {
  targetType: "project_file" | "research_post" | "project";
  targetId: string;
  initialBookmarked?: boolean;
  initialBookmarkCount?: number;
};

export default function FileActions({
  targetType,
  targetId,
  initialBookmarked = false,
  initialBookmarkCount = 0,
}: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(initialBookmarkCount);
  const [bookmarking, setBookmarking] = useState(false);
  const mountedRef = useRef(false);
  const statusRequestSeqRef = useRef(0);

  const refreshStatus = useCallback(async () => {
    const seq = ++statusRequestSeqRef.current;
    const res = await fetch("/api/items/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ target_type: targetType, target_id: targetId }),
    });
    if (!res.ok) {
      console.warn("[FileActions] status request failed:", res.status);
      return;
    }
    const data = await res.json();
    console.debug("[FileActions] status response:", data);
    if (!mountedRef.current || seq !== statusRequestSeqRef.current) return;
    setBookmarked(Boolean(data.bookmarked));
    setBookmarkCount(Number(data.bookmark_count ?? 0));
  }, [targetType, targetId]);

  useEffect(() => {
    mountedRef.current = true;
    refreshStatus().catch((err) => {
      console.error("[FileActions] status fetch error:", err);
    });
    return () => {
      mountedRef.current = false;
    };
  }, [refreshStatus]);

  async function toggleBookmark() {
    if (bookmarking) return;
    statusRequestSeqRef.current += 1;
    const previousBookmarked = bookmarked;
    const previousBookmarkCount = bookmarkCount;
    const nextBookmarked = !bookmarked;
    const optimisticBookmarkCount = Math.max(0, previousBookmarkCount + (nextBookmarked ? 1 : -1));
    setBookmarking(true);
    setBookmarked(nextBookmarked);
    setBookmarkCount(optimisticBookmarkCount);
    try {
      const res = await fetch("/api/items/toggle-bookmark", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target_type: targetType, target_id: targetId }),
      });
      if (!res.ok) throw new Error(`toggle-bookmark failed: ${res.status}`);
      const data = await res.json();
      console.debug("[FileActions] toggle-bookmark response:", data);
      if (!mountedRef.current) return;
      setBookmarked(Boolean(data.bookmarked));
      setBookmarkCount(Number(data.bookmark_count ?? optimisticBookmarkCount));
    } catch (e) {
      console.error("[FileActions] toggle-bookmark error:", e);
      if (!mountedRef.current) return;
      setBookmarked(previousBookmarked);
      setBookmarkCount(previousBookmarkCount);
    } finally {
      if (mountedRef.current) setBookmarking(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggleBookmark}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        disabled={bookmarking}
        className={`inline-flex items-center gap-2 text-xs font-medium cursor-pointer pointer-events-auto ${
          bookmarked ? "text-[var(--al-accent)]" : "text-[var(--al-muted)]"
        } ${bookmarking ? "opacity-70" : ""}`}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? "ブックマークを解除" : "ブックマークする"}
        title={bookmarked ? "ブックマークを解除" : "ブックマークする"}
      >
        <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
      </button>
    </div>
  );
}
