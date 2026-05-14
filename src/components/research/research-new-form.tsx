"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  analyzeResearchAction,
  saveResearchAction,
  type AnalyzeState,
  type SaveState,
} from "@/lib/research/actions";
import type { ResearchDraft } from "@/lib/research/gemini";
import { cn } from "@/lib/utils";

type Mode = "pdf" | "text";

type SavedDraft = {
  draft: ResearchDraft;
  rawText: string;
  fileName: string | null;
  pdfPath: string | null;
};

export function ResearchNewForm() {
  const [analyzeState, analyzeFormAction] = useActionState<AnalyzeState, FormData>(
    analyzeResearchAction,
    {},
  );
  const [mode, setMode] = useState<Mode>("pdf");
  const [pendingDraft, setPendingDraft] = useState<SavedDraft | null>(null);

  useEffect(() => {
    if ("ok" in analyzeState && analyzeState.ok) {
      setPendingDraft({
        draft: analyzeState.draft,
        rawText: analyzeState.rawText,
        fileName: analyzeState.fileName,
        pdfPath: analyzeState.pdfPath,
      });
    }
  }, [analyzeState]);

  if (pendingDraft) {
    return (
      <DraftEditor
        initial={pendingDraft}
        onCancel={() => setPendingDraft(null)}
      />
    );
  }

  return (
    <form
      action={analyzeFormAction}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="input_type" value={mode} />

      <div className="flex gap-2 rounded-full bg-slate-100 p-1 text-xs font-medium">
        <ModeButton current={mode} value="pdf" onClick={() => setMode("pdf")}>
          📄 PDFをアップロード
        </ModeButton>
        <ModeButton current={mode} value="text" onClick={() => setMode("text")}>
          📝 テキストを貼り付け
        </ModeButton>
      </div>

      {mode === "pdf" ? (
        <div className="space-y-2">
          <Label htmlFor="pdf">PDF ファイル</Label>
          <Input
            id="pdf"
            name="pdf"
            type="file"
            accept="application/pdf"
            required
          />
          <p className="text-xs text-muted-foreground">
            論文・スライドなど。最大 15MB / 本文抽出できる PDF が対象（画像のみのスキャン PDF は不可）。
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="raw_text">研究テキスト</Label>
          <textarea
            id="raw_text"
            name="raw_text"
            rows={10}
            required
            minLength={30}
            className="w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#667eea]/30"
            placeholder="研究の概要・取り組みの内容などを貼り付けてください。"
          />
          <p className="text-xs text-muted-foreground">
            最初の 4000 文字程度を AI に渡します。長すぎる場合は要点を貼ってください。
          </p>
        </div>
      )}

      {"error" in analyzeState && analyzeState.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {analyzeState.error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <AnalyzeButton />
      </div>
    </form>
  );
}

function DraftEditor({
  initial,
  onCancel,
}: {
  initial: SavedDraft;
  onCancel: () => void;
}) {
  const [saveState, saveFormAction] = useActionState<SaveState, FormData>(
    saveResearchAction,
    {},
  );
  const [title, setTitle] = useState(initial.draft.title);
  const [summary, setSummary] = useState(initial.draft.summary);
  const [tags, setTags] = useState(initial.draft.tags.join(", "));

  return (
    <form
      action={saveFormAction}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="raw_text" value={initial.rawText} />
      <input type="hidden" name="file_name" value={initial.fileName ?? ""} />
      <input type="hidden" name="pdf_path" value={initial.pdfPath ?? ""} />

      <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3 text-xs text-[#5b3fbf]">
        🤖 AI が下書きを生成しました。内容を確認・修正してから保存してください。
        {initial.fileName ? (
          <span className="ml-1">
            （添付:{" "}
            <span className="font-mono text-[#3d2a8a]">{initial.fileName}</span>）
          </span>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">要約</Label>
        <textarea
          id="summary"
          name="summary"
          rows={6}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          className="w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#667eea]/30"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">タグ（カンマ区切り）</Label>
        <Input
          id="tags"
          name="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="例: 機械学習, Python, 自然言語処理"
        />
      </div>

      {saveState.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {saveState.error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          やり直す
        </button>
        <SaveButton />
      </div>
    </form>
  );
}

function ModeButton({
  current,
  value,
  onClick,
  children,
}: {
  current: Mode;
  value: Mode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-full px-3 py-1.5 transition",
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700",
      )}
    >
      {children}
    </button>
  );
}

function AnalyzeButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-11 min-w-[12rem] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] font-semibold text-white shadow-md hover:shadow-lg hover:brightness-110 disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "AI が分析中…" : "🤖 AI解析を開始"}
    </Button>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-10 min-w-[8rem] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-sm font-semibold text-white shadow-md hover:shadow-lg hover:brightness-110 disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "保存中…" : "公開して保存"}
    </Button>
  );
}
