"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Check,
  FileUp,
  FolderOpen,
  FolderPlus,
  Loader2,
  Presentation,
  Sparkles,
  Upload,
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

type Mode = "pdf" | "slides";

type SavedDraft = {
  draft: ResearchDraft;
  rawText: string;
  fileName: string | null;
  pdfPath: string | null;
  slideViewUrl: string | null;
  projectId: string;
  projectName: string;
  inputMode: "pdf" | "slides";
};

type ProjectOption = {
  id: string;
  name: string;
};

const fieldClass =
  "al-auth-input shadow-none focus:ring-[var(--al-accent)]/20";

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
  const [slideViewUrl, setSlideViewUrl] = useState("");
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [dismissedDraftKey, setDismissedDraftKey] = useState<string | null>(null);

  useEffect(() => {
    setPdfFileName(null);
    setClientError(null);
  }, [mode]);
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
          slideViewUrl: analyzeState.slideViewUrl,
          projectId: analyzeState.projectId,
          projectName: analyzeState.projectName,
          inputMode: analyzeState.inputMode,
        }}
        onCancel={() => setDismissedDraftKey(currentDraftKey)}
      />
    );
  }

  return (
    <form
      action={analyzeFormAction}
      className="al-glass-card overflow-hidden"
      onSubmit={(e) => {
        const form = e.currentTarget;
        const fileInput = form.elements.namedItem("pdf") as HTMLInputElement | null;
        const file = fileInput?.files?.[0];

        if (!useNewProject && !projectId) {
          e.preventDefault();
          setClientError("保存先のプロジェクトを選んでください。");
          return;
        }
        if (mode === "pdf" && (!file || file.size === 0)) {
          e.preventDefault();
          setClientError(
            "PDF を選択してください。Finder では一覧でファイル名を1回クリックしてから「開く」を押してください。",
          );
          return;
        }
        setClientError(null);
      }}
    >
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
            <ProjectPicker
              projects={projects}
              value={projectId}
              onChange={setProjectId}
            />
          )}

          {useNewProject ? <input type="hidden" name="project_id" value="" /> : null}
        </section>

        <section className="space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="text-sm font-semibold text-[var(--al-ink)]">
              入力方法
            </h2>
            <p className="mt-0.5 text-xs text-[var(--al-muted)]">
              PDF またはスライド URL で研究を登録できます
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ModeCard
              active={mode === "pdf"}
              icon={FileUp}
              title="PDF"
              description="論文・レポートなど PDF をアップロード"
              onClick={() => setMode("pdf")}
            />
            <ModeCard
              active={mode === "slides"}
              icon={Presentation}
              title="スライド"
              description="Google スライド URL（任意で PDF も添付）"
              onClick={() => setMode("slides")}
            />
          </div>
        </section>

        <section className="space-y-4 p-5 sm:p-6">
          {mode === "pdf" ? (
            <PdfFilePicker
              id="pdf_only"
              required
              selectedName={pdfFileName}
              onSelected={setPdfFileName}
              description="AI が要約・タグを生成し、PDF を Storage に保存します。"
            />
          ) : (
            <div className="space-y-5 rounded-xl border border-[color-mix(in_srgb,var(--al-accent)_20%,var(--al-border))] bg-[var(--al-accent-soft)]/25 p-4 sm:p-5">
              <div>
                <h3 className="text-sm font-semibold text-[var(--al-ink)]">
                  スライド・研究資料
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--al-muted)]">
                  URL だけでも登録できます（表示用の保存）。PDF は任意で、入れたときだけ AI
                  が要約します。
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slide_view_url" className="text-[var(--al-ink)]">
                  Google スライド URL
                </Label>
                <Input
                  id="slide_view_url"
                  name="slide_view_url"
                  type="url"
                  value={slideViewUrl}
                  onChange={(e) => setSlideViewUrl(e.target.value)}
                  placeholder="https://docs.google.com/presentation/d/..."
                  className={fieldClass}
                />
                <p className="text-xs leading-relaxed text-[var(--al-muted)]">
                  共有は「リンクを知っている全員が閲覧可」に。プロジェクト画面でスライド形式のまま表示されます。
                </p>
              </div>

              <div className="relative flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-[var(--al-border)]" aria-hidden />
                <span className="text-[11px] font-medium text-[var(--al-muted)]">
                  任意：PDF（AI 要約用）
                </span>
                <span className="h-px flex-1 bg-[var(--al-border)]" aria-hidden />
              </div>

              <PdfFilePicker
                id="pdf_slides_optional"
                optional
                selectedName={pdfFileName}
                onSelected={setPdfFileName}
                description="論文・レポートの PDF を載せると AI が要約を作ります。スライドだけの場合は空で OK。"
              />
            </div>
          )}
        </section>

        {clientError || ("error" in analyzeState && analyzeState.error) ? (
          <div className="px-5 sm:px-6">
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {clientError ??
                ("error" in analyzeState ? analyzeState.error : "")}
            </p>
          </div>
        ) : null}

        <div className="flex justify-end bg-[var(--al-surface)]/80 px-5 py-4 sm:px-6">
          <AnalyzeButton mode={mode} pdfReady={mode !== "pdf" || Boolean(pdfFileName)} />
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
  const [saveName, setSaveName] = useState(initial.draft.title);
  const [summary, setSummary] = useState(initial.draft.summary);
  const [tags, setTags] = useState(initial.draft.tags.join(", "));
  const isSlideOnly =
    initial.inputMode === "slides" &&
    Boolean(initial.slideViewUrl) &&
    !initial.pdfPath;
  const usedAi = initial.inputMode !== "slides" || Boolean(initial.pdfPath);

  return (
    <form action={saveFormAction} className="al-glass-card overflow-hidden">
      <input type="hidden" name="raw_text" value={initial.rawText} />
      <input type="hidden" name="project_id" value={initial.projectId} />
      <input type="hidden" name="file_name" value={initial.fileName ?? ""} />
      <input type="hidden" name="pdf_path" value={initial.pdfPath ?? ""} />
      <input
        type="hidden"
        name="slide_view_url"
        value={initial.slideViewUrl ?? ""}
      />

      <div className="border-b border-[var(--al-border)] bg-[linear-gradient(135deg,var(--al-accent-soft)_0%,#fff_55%)] px-5 py-4 sm:px-6">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--al-accent)] ring-1 ring-[var(--al-border)]">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 text-sm leading-relaxed text-[var(--al-ink)]">
            <p className="font-medium">
              {usedAi ? "AI が下書きを生成しました" : "アップロード内容を確認してください"}
            </p>
            <p className="mt-1 text-xs text-[var(--al-muted)]">
              保存名を決めてから公開保存してください。
              <span className="text-[var(--al-ink)]">
                {" "}
                保存先: {initial.projectName}
              </span>
            </p>
            {initial.pdfPath ? (
              <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs text-emerald-800">
                PDF を Storage に保存済みです。公開保存するとプロジェクトからダウンロード・表示できます。
              </p>
            ) : isSlideOnly ? (
              <p className="mt-2 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-2 text-xs text-sky-900">
                スライド URL を保存します（表示用）。保存名は必須、要約は任意です。
              </p>
            ) : initial.fileName ? (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
                PDF ファイルの保存に失敗しています。スライド・PDF の入力からやり直してください。
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="divide-y divide-[var(--al-border)]">
        <section className="space-y-4 p-5 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="save_name" className="text-[var(--al-ink)]">
              保存名
            </Label>
            <Input
              id="save_name"
              name="title"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              required
              minLength={1}
              maxLength={80}
              placeholder={
                isSlideOnly
                  ? "例: 卒論発表スライド 2025"
                  : "例: LLM による文献レビュー"
              }
              className={fieldClass}
            />
            <p className="text-xs text-[var(--al-muted)]">
              プロジェクトの資料一覧に表示される名前です。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary" className="text-[var(--al-ink)]">
              要約{isSlideOnly ? "（任意）" : null}
            </Label>
            <textarea
              id="summary"
              name="summary"
              rows={8}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required={!isSlideOnly}
              className={cn(fieldClass, "min-h-[180px] resize-y py-3")}
              placeholder={
                isSlideOnly
                  ? "空でも保存できます"
                  : "AI が生成した要約を必要に応じて修正してください"
              }
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

function ProjectPicker({
  projects,
  value,
  onChange,
}: {
  projects: ProjectOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--al-border)] bg-[var(--al-surface)] px-4 py-6 text-center text-sm leading-relaxed text-[var(--al-muted)]">
        プロジェクトがありません。
        <br />
        上の「新規プロジェクトを作る」から作成してください。
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label="保存先プロジェクト"
        className="grid gap-2 sm:grid-cols-2"
      >
        {projects.map((p) => (
          <ProjectOptionCard
            key={p.id}
            name={p.name}
            selected={value === p.id}
            onSelect={() => onChange(p.id)}
          />
        ))}
      </div>
      {value === "" ? (
        <p className="text-xs text-amber-800/90">
          保存先のプロジェクトを1つ選んでください。
        </p>
      ) : (
        <p className="text-xs text-[var(--al-muted)]">
          選択中:{" "}
          <span className="font-medium text-[var(--al-ink)]">
            {projects.find((p) => p.id === value)?.name}
          </span>
        </p>
      )}
      <input type="hidden" name="project_id" value={value} required />
    </div>
  );
}

function ProjectOptionCard({
  name,
  selected,
  onSelect,
}: {
  name: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
        selected
          ? "border-[color-mix(in_srgb,var(--al-accent)_45%,var(--al-border))] bg-[var(--al-accent-soft)]/50 shadow-sm ring-1 ring-[var(--al-accent)]/25"
          : "border-[var(--al-border)] bg-white hover:border-[color-mix(in_srgb,var(--al-accent)_25%,var(--al-border))] hover:bg-[var(--al-surface)]",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1",
          selected
            ? "bg-white text-[var(--al-accent)] ring-[var(--al-border)]"
            : "bg-[var(--al-surface)] text-[var(--al-muted)] ring-[var(--al-border)]",
        )}
      >
        <FolderOpen className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[var(--al-ink)]">
          {name}
        </span>
        <span className="mt-0.5 block text-xs text-[var(--al-muted)]">
          研究資料の保存先
        </span>
      </span>
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected
            ? "border-[var(--al-accent)] bg-[var(--al-accent)] text-white"
            : "border-[var(--al-border)] bg-white text-transparent",
        )}
        aria-hidden
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    </button>
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

function PdfFilePicker({
  id,
  required,
  optional,
  selectedName,
  onSelected,
  label = "PDF ファイル",
  description,
  compact = false,
}: {
  id: string;
  required?: boolean;
  optional?: boolean;
  selectedName: string | null;
  onSelected: (name: string | null) => void;
  label?: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[var(--al-ink)]">
        {label}
        {optional ? (
          <span className="ml-1 text-xs font-normal text-[var(--al-muted)]">（任意）</span>
        ) : null}
      </Label>
      <div className="relative">
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--al-border)] bg-[var(--al-surface)] text-center ring-[var(--al-accent)]/0 transition-colors",
            compact ? "px-4 py-6" : "px-4 py-10",
            selectedName &&
              "border-[color-mix(in_srgb,var(--al-accent)_40%,var(--al-border))] bg-[var(--al-accent-soft)]/30",
          )}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[var(--al-accent)] ring-1 ring-[var(--al-border)]">
            <FileUp className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <span className="text-sm font-medium text-[var(--al-ink)]">
            {selectedName ? "別の PDF を選ぶ" : "クリックして PDF を選択"}
          </span>
          <span className="max-w-sm px-2 text-xs leading-relaxed text-[var(--al-muted)]">
            {description}
          </span>
        </label>
        <input
          id={id}
          name="pdf"
          type="file"
          accept=".pdf,application/pdf"
          required={required}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          onChange={(e) => {
            const file = e.target.files?.[0];
            onSelected(file && file.size > 0 ? file.name : null);
          }}
        />
      </div>
      {selectedName ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          選択済み: <span className="font-medium">{selectedName}</span>
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-[var(--al-muted)]">
          macOS の選択画面では、一覧で PDF 名を<strong>1回クリック</strong>
          して青く選択してから「開く」を押してください（何も選ばないとボタンが灰色のままです）。
        </p>
      )}
    </div>
  );
}

function AnalyzeButton({
  mode,
  pdfReady = true,
}: {
  mode: Mode;
  pdfReady?: boolean;
}) {
  const { pending } = useFormStatus();
  const isSlides = mode === "slides";

  return (
    <button
      type="submit"
      disabled={pending || !pdfReady}
      className="al-btn-gradient inline-flex h-11 min-w-[11rem] items-center justify-center gap-2 px-5 text-sm disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {isSlides ? "アップロード中…" : "AI が分析中…"}
        </>
      ) : isSlides ? (
        <>
          <Upload className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          アップロード
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
