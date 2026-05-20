"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
// removed unused Input import
import { useRouter } from "next/navigation";

export default function ProjectEditModal({
  projectId,
  initialDescription,
}: {
  projectId: string;
  initialDescription: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialDescription ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects/update-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projectId, description: value }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "更新に失敗しました");
      } else {
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("ネットワークエラー");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        概要を編集
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-xl rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">プロジェクト概要を編集</h3>
            <p className="mt-1 text-xs text-slate-500">簡潔にプロジェクトの目的や対象を説明してください。</p>
            <textarea
              className="mt-3 w-full min-h-[120px] rounded-md border border-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#667eea]/30"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                キャンセル
              </Button>
              <Button onClick={save} disabled={loading}>
                {loading ? "保存中…" : "保存"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
