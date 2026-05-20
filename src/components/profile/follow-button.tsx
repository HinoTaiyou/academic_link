"use client";

import { useState } from "react";

type Props = {
  targetUserId: string;
  initialFollowing?: boolean;
};

export function FollowButton({ targetUserId, initialFollowing = false }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function toggleFollow() {
    if (pending) return;
    const prev = following;
    const next = !following;
    setPending(true);
    setErrorMessage(null);
    setFollowing(next);

    try {
      const res = await fetch("/api/items/toggle-bookmark", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target_type: "profile", target_id: targetUserId }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        const message = payload?.error ?? `toggle-follow failed: ${res.status}`;
        setFollowing(prev);
        setErrorMessage(message);
        return;
      }
      const data = await res.json();
      setFollowing(Boolean(data.bookmarked));
    } catch (error) {
      console.error("[FollowButton] toggle-follow error:", error);
      setFollowing(prev);
      setErrorMessage(
        error instanceof Error ? error.message : "フォローの更新に失敗しました。",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggleFollow}
        disabled={pending}
        className={
          following
            ? "al-btn-outline inline-flex items-center gap-1.5 text-xs sm:text-sm"
            : "al-btn-gradient inline-flex items-center gap-1.5 text-xs sm:text-sm"
        }
        aria-pressed={following}
        aria-label={following ? "フォローを解除" : "フォローする"}
        title={following ? "フォローを解除" : "フォローする"}
      >
        {following ? "フォロー中" : "フォローする"}
      </button>
      {errorMessage ? (
        <p className="max-w-[280px] text-xs text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}
