"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlignLeft,
  FileUp,
  FolderPlus,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  analyzeResearchAction,
  saveResearchAction,
  type AnalyzeState,
  type SaveState,
} from "../_lib/actions";
import type { ResearchDraft } from "../_lib/gemini";
import { cn } from "@/lib/utils";

type Mode = "pdf" | "text";

type SavedDraft = {
  draft: ResearchDraft;
  rawText: string;
  fileName: string | null;
  pdfPath: string | null;
  projectId: string;
  projectName: string;
};

type ProjectOption = {
  id: string;
  name: string;
};

const fieldClass =
  "al-auth-input shadow-none focus:ring-[var(--al-accent)]/20";

const selectClass = cn(fieldClass, "h-12 appearance-none");

export function ResearchNewForm({
  projects,
  initialProjectId,
}: {
  projects: ProjectOption[];
  initialProjectId?: string;
}) {
  const [analyzeState, analyzeFormAction] = useActionState<AnalyzeState, FormData>(
    analyzeResearchAction,
    {},
  );
  const [mode, setMode] = useState<Mode>("pdf");
  const [useNewProject, setUseNewProject] = useState(projects.length === 0);
  const [projectId, setProjectId] = useState(() => {
    if (initialProjectId && projects.some((p) => p.id === initialProjectId)) {
      return initialProjectId;
    }
    return "";
  });
  const [newProjectName, setNewProjectName] = useState("");
  const [dismissedDraftKey, setDismissedDraftKey] = useState<string | null>(null);
  const hasAnalyzedDraft = "ok" in analyzeState && analyzeState.ok;
  const currentDraftKey = hasAnalyzedDraft
    ? [
        analyzeState.projectId,
        analyzeState.fileName ?? "",
        analyzeState.rawText.slice(0, 80),
      ].join("::")
    : null;

  if (hasAnalyzedDraft && currentDraftKey !== dismissedDraftKey) {
    return (
      <DraftEditor
        initial={{
          draft: analyzeState.draft,
          rawText: analyzeState.rawText,
          fileName: analyzeState.fileName,
          pdfPath: analyzeState.pdfPath,
          projectId: analyzeState.projectId,
          projectName: analyzeState.projectName,
        }}
        onCancel={() => setDismissedDraftKey(currentDraftKey)}
      />
    );
  }

  return (
    <form action={analyzeFormAction} className="al-glass-card overflow-hidden">
      <input type="hidden" name="input_type" value={mode} />

      <div className="divide-y divide-[var(--al-border)]">
        <section className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[var(--al-ink)]">
                保存先プロジェクト
              </h2>
              <p className="mt-0.5 text-xs text-[var(--al-muted)]">
                研究投稿を紐づけるフォルダを選びます
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUseNewProject((v) => !v)}
              disabled={projects.length === 0}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--al-accent)] hover:underline disabled:opacity-40"
            >
              <FolderPlus className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              {useNewProject ? "既存から選ぶ" : "新規プロジェクトを作る"}
            </button>
          </div>

          {useNewProject ? (
            <div className="space-y-2">
              <Label htmlFor="new_project_name" className="text-[var(--al-ink)]">
                プロジェクト名
              </Label>
              <Input
                id="new_project_name"
                name="new_project_name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                required
                minLength={2}
                maxLength={80}
                placeholder="例: LLMによる文献レビュー"
                className={fieldClass}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="project_id" className="text-[var(--al-ink)]">
                プロジェクト
              </Label>
              <select
                id="project_id"
                name="project_id"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                className={selectClass}
              >
                {projectId === "" ? (
                  <option value="">プロジェクトを選択してください</option>
                ) : null}
                {projects.length === 0 ? (
                  <option value="">
                    プロジェクトがありません（新規作成してください）
                  </option>
                ) : (
                  projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {useNewProject ? <input type="hidden" name="project_id" value="" /> : null}
        </section>

        <section className="space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="text-sm font-semibold text-[var(--al-ink)]">
              入力方法
            </h2>
            <p className="mt-0.5 text-xs text-[var(--al-muted)]">
              PDF またはテキストのどちらかを選んでください
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ModeCard
              active={mode === "pdf"}
              icon={FileUp}
              title="PDF をアップロード"
              description="論文・スライドなど（最大 15MB）"
              onClick={() => setMode("pdf")}
            />
            <ModeCard
              active={mode === "text"}
              icon={AlignLeft}
              title="テキストを貼り付け"
              description="概要・取り組み内容を直接入力"
              onClick={() => setMode("text")}
            />
          </div>
        </section>

        <section className="space-y-4 p-5 sm:p-6">
          {mode === "pdf" ? (
            <>
              <Label htmlFor="pdf" className="text-[var(--al-ink)]">
                PDF ファイル
              </Label>
              <label
                htmlFor="pdf"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--al-border)] bg-[var(--al-surface)] px-4 py-10 text-center transition-colors hover:border-[color-mix(in_srgb,var(--al-accent)_40%,var(--al-border))] hover:bg-[var(--al-accent-soft)]/40"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[var(--al-accent)] ring-1 ring-[var(--al-border)]">
                  <FileUp className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="text-sm font-medium text-[var(--al-ink)]">
                  クリックしてファイルを選択
                </span>
                <span className="max-w-xs text-xs text-[var(--al-muted)]">
                  図表中心の PDF も解析を試みます。結果は編集画面で必ず確認してください。
                </span>
                <Input
                  id="pdf"
                  name="pdf"
                  type="file"
                  accept="application/pdf"
                  required
                  className="sr-only"
                />
              </label>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="raw_text" className="text-[var(--al-ink)]">
                研究テキスト
              </Label>
              <textarea
                id="raw_text"
                name="raw_text"
                rows={12}
                required
                minLength={30}
                className={cn(fieldClass, "min-h-[240px] resize-y py-3")}
                placeholder="研究の概要・取り組みの内容などを貼り付けてください。"
              />
              <p className="text-xs text-[var(--al-muted)]">
                最初の 4000 文字程度を AI に渡します。長すぎる場合は要点を貼ってください。
              </p>
            </div>
          )}
        </section>

        {"error" in analyzeState && analyzeState.error ? (
          <div className="px-5 sm:px-6">
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {analyzeState.error}
            </p>
          </div>
        ) : null}

        <div className="flex justify-end bg-[var(--al-surface)]/80 px-5 py-4 sm:px-6">
          <AnalyzeButton />
        </div>
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
    <form action={saveFormAction} className="al-glass-card overflow-hidden">
      <input type="hidden" name="raw_text" value={initial.rawText} />
      <input type="hidden" name="project_id" value={initial.projectId} />
      <input type="hidden" name="file_name" value={initial.fileName ?? ""} />
      <input type="hidden" name="pdf_path" value={initial.pdfPath ?? ""} />

      <div className="border-b border-[var(--al-border)] bg-[linear-gradient(135deg,var(--al-accent-soft)_0%,#fff_55%)] px-5 py-4 sm:px-6">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--al-accent)] ring-1 ring-[var(--al-border)]">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 text-sm leading-relaxed text-[var(--al-ink)]">
            <p className="font-medium">AI が下書きを生成しました</p>
            <p className="mt-1 text-xs text-[var(--al-muted)]">
              内容を確認・修正してから保存してください。
              <span className="text-[var(--al-ink)]">
                {" "}
                保存先: {initial.projectName}
              </span>
              {initial.fileName ? (
                <span className="font-mono"> / {initial.fileName}</span>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-[var(--al-border)]">
        <section className="space-y-4 p-5 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-[var(--al-ink)]">
              タイトル
            </Label>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={fieldClass}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary" className="text-[var(--al-ink)]">
              要約
            </Label>
            <textarea
              id="summary"
              name="summary"
              rows={8}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
              className={cn(fieldClass, "min-h-[180px] resize-y py-3")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="text-[var(--al-ink)]">
              タグ（カンマ区切り）
            </Label>
            <Input
              id="tags"
              name="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例: 機械学習, Python, 自然言語処理"
              className={fieldClass}
            />
          </div>
        </section>

        {saveState.error ? (
          <div className="px-5 sm:px-6">
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {saveState.error}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 bg-[var(--al-surface)]/80 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--al-muted)] transition hover:bg-white hover:text-[var(--al-ink)]"
          >
            やり直す
          </button>
          <SaveButton />
        </div>
      </div>
    </form>
  );
}

function ModeCard({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: typeof FileUp;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
        active
          ? "border-[color-mix(in_srgb,var(--al-accent)_45%,var(--al-border))] bg-[var(--al-accent-soft)]/50 shadow-sm ring-1 ring-[var(--al-accent)]/25"
          : "border-[var(--al-border)] bg-white hover:border-[color-mix(in_srgb,var(--al-accent)_25%,var(--al-border))] hover:bg-[var(--al-surface)]",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg ring-1",
          active
            ? "bg-white text-[var(--al-accent)] ring-[var(--al-border)]"
            : "bg-[var(--al-surface)] text-[var(--al-muted)] ring-[var(--al-border)]",
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="text-sm font-semibold text-[var(--al-ink)]">{title}</span>
      <span className="text-xs leading-relaxed text-[var(--al-muted)]">
        {description}
      </span>
    </button>
  );
}

function AnalyzeButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="al-btn-gradient inline-flex h-11 min-w-[11rem] items-center justify-center gap-2 px-5 text-sm disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          AI が分析中…
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          AI 解析を開始
        </>
      )}
    </button>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="al-btn-gradient inline-flex h-10 min-w-[8rem] items-center justify-center gap-2 px-4 text-sm disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          保存中…
        </>
      ) : (
        "公開して保存"
      )}
    </button>
  );
}
