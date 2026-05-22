"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteProjectButton({
  projectId,
  projectName,
  redirectTo = "/dashboard",
}: {
  projectId: string;
  projectName: string;
  redirectTo?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const label = projectName.trim() || "このプロジェクト";
    if (
      !window.confirm(
        `「${label}」を削除しますか？\n登録済みの資料・チャット・要約もすべて消え、元に戻せません。`,
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projectId }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!json.ok) {
        setError(json.error ?? "削除に失敗しました");
        return;
      }
      window.location.assign(redirectTo);
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-xs text-[var(--al-muted)] hover:text-destructive"
        onClick={handleDelete}
        disabled={loading}
        aria-label={`${projectName || "プロジェクト"}を削除`}
      >
        <Trash2 className="size-3.5" aria-hidden />
        {loading ? "削除中…" : "プロジェクトを削除"}
      </Button>
      {error ? (
        <p className="max-w-[16rem] text-right text-[11px] text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
