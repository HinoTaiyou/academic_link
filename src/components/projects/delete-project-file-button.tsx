"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteProjectFileButton({
  projectId,
  fileId,
  fileTitle,
}: {
  projectId: string;
  fileId: string;
  fileTitle: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const label = fileTitle.trim() || "この資料";
    if (
      !window.confirm(
        `「${label}」を削除しますか？\n保存した PDF や要約も消え、元に戻せません。`,
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects/delete-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projectId, fileId }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!json.ok) {
        setError(json.error ?? "削除に失敗しました");
        return;
      }
      router.refresh();
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
        className="h-7 gap-1 text-xs text-[var(--al-muted)] hover:text-destructive"
        onClick={handleDelete}
        disabled={loading}
        aria-label={`${fileTitle || "資料"}を削除`}
      >
        <Trash2 className="size-3.5" aria-hidden />
        {loading ? "削除中…" : "削除"}
      </Button>
      {error ? (
        <p className="max-w-[14rem] text-right text-[11px] text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
