import Link from "next/link";
import { FileText, FolderOpen } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import ProjectEditModal from "@/components/projects/project-edit-modal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "プロジェクト詳細 | Academic Link",
};

type Props = {
  params: Promise<{ id: string }>;
};

type ProjectFileItem = {
  id: string;
  createdAt: string;
  sourceType: string;
  title: string;
  summary: string;
  tags: string[];
  rawText: string;
  fileName: string | null;
  storagePath: string | null;
  mimeType: string | null;
  figureCount: number;
};

const BUCKET = "research-pdfs";

export default async function ProjectDetailPage({ params }: Props) {
  const { id: projectId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("real_name, department, grade, interest_tags")
    .eq("id", user.id)
    .maybeSingle();

  let project: {
    id: string;
    name: string;
    description: string | null;
    pinned: boolean;
    created_at: string;
    updated_at: string;
    owner_id: string;
  } | null = null;

  const ownProjectRes = await supabase
    .from("projects")
    .select("id, name, description, pinned, created_at, updated_at, owner_id")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .eq("archived", false)
    .maybeSingle();

  if (ownProjectRes.data) {
    project = ownProjectRes.data;
  } else {
    const readClient = createAdminClient() ?? supabase;
    const publicRes = await readClient
      .from("projects")
      .select("id, name, description, pinned, created_at, updated_at, owner_id")
      .eq("id", projectId)
      .eq("archived", false)
      .maybeSingle();
    project = publicRes.data ?? null;
  }

  if (!project) notFound();

  const ownerId = project.owner_id;
  const isOwner = ownerId === user.id;
  const dataClient = isOwner ? supabase : (createAdminClient() ?? supabase);

  let fileRows: Array<Record<string, unknown>> = [];
  let fileFetchNotice: string | null = null;
  const debugErrorDetails: string[] = [];

  // Try primary project_files query
  const primaryFilesRes = await dataClient
    .from("project_files")
    .select(
      "id, created_at, source_type, title, summary, tags, raw_text, file_name, storage_path, mime_type, figure_notes",
    )
    .eq("project_id", projectId)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (!primaryFilesRes.error) {
    fileRows = (primaryFilesRes.data ?? []) as Array<Record<string, unknown>>;
  } else {
    debugErrorDetails.push(String(primaryFilesRes.error?.message ?? primaryFilesRes.error));

    const fallbackFilesRes = await dataClient
      .from("project_files")
      .select(
        "id, created_at, source_type, title, summary, tags, raw_text, file_name, storage_path, mime_type",
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (!fallbackFilesRes.error) {
      fileRows = (fallbackFilesRes.data ?? []) as Array<Record<string, unknown>>;
      fileFetchNotice =
        "資料の一部項目（図表メモ）が利用できないため、互換モードで表示しています。";
    } else {
      debugErrorDetails.push(String(fallbackFilesRes.error?.message ?? fallbackFilesRes.error));

      const postsFallbackRes = await dataClient
        .from("research_posts")
        .select("id, created_at, title, summary, tags, raw_text, file_name, pdf_path")
        .eq("author_id", ownerId)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (!postsFallbackRes.error) {
        fileRows = (postsFallbackRes.data ?? []).map((row) => ({
          id: row.id,
          created_at: row.created_at,
          source_type: row.pdf_path ? "pdf" : "text",
          title: row.title,
          summary: row.summary,
          tags: row.tags,
          raw_text: row.raw_text,
          file_name: row.file_name,
          storage_path: row.pdf_path,
          mime_type: row.pdf_path ? "application/pdf" : "text/plain",
          figure_notes: [],
        })) as Array<Record<string, unknown>>;

        fileFetchNotice =
          "project_files の読み込みに失敗したため、research_posts から代替表示しています。";
      } else {
        debugErrorDetails.push(String(postsFallbackRes.error?.message ?? postsFallbackRes.error));
        fileRows = [];
        fileFetchNotice = "資料一覧の読み込みに失敗しました。時間を置いて再度お試しください。";
      }
    }
  }

  const files: ProjectFileItem[] = (fileRows ?? []).map((row) => ({
    id: String(row.id),
    createdAt: String(row.created_at),
    sourceType: String(row.source_type ?? "other"),
    title: String(row.title ?? "無題"),
    summary: String(row.summary ?? ""),
    tags: (row.tags as string[] | null) ?? [],
    rawText: String(row.raw_text ?? ""),
    fileName: (row.file_name as string | null) ?? null,
    storagePath: (row.storage_path as string | null) ?? null,
    mimeType: (row.mime_type as string | null) ?? null,
    figureCount: Array.isArray(row.figure_notes) ? row.figure_notes.length : 0,
  }));

  const signedEntries = await Promise.all(
    files.map(async (file) => {
      if (!file.storagePath) return [file.id, null] as const;
      const { data, error } = await dataClient.storage
        .from(BUCKET)
        .createSignedUrl(file.storagePath, 60 * 10);
      if (error || !data) return [file.id, null] as const;
      return [file.id, data.signedUrl] as const;
    }),
  );

  const signedMap = new Map<string, string | null>(signedEntries);

  const interestTags = (profile?.interest_tags ?? []) as string[];

  return (
    <AppShell
      active="profile"
      profile={{
        id: user.id,
        realName: profile?.real_name ?? null,
        department: profile?.department ?? null,
        grade: profile?.grade ?? null,
        interestTags,
        email: user.email ?? null,
      }}
    >
      <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 md:py-10">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <section className="al-glass-card overflow-hidden">
            <div className="border-b border-[var(--al-border)] bg-[linear-gradient(135deg,var(--al-accent-soft)_0%,#fff_55%)] px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--al-accent)] shadow-sm ring-1 ring-[var(--al-border)]">
                    <FolderOpen className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="al-section-eyebrow">Project</p>
                    <h1 className="mt-1 text-xl font-bold tracking-tight text-[var(--al-ink)] sm:text-2xl">
                      {project.name}
                    </h1>
                  </div>
                </div>
                {isOwner ? (
                  <Link
                    href={`/research/new?projectId=${project.id}`}
                    className="al-btn-outline shrink-0"
                  >
                    ＋ このプロジェクトに研究を追加
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <Link
                href={`/u/${ownerId}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--al-muted)] hover:text-[var(--al-accent)]"
              >
                ← プロフィールに戻る
              </Link>
              <div className="flex flex-wrap items-start gap-3">
                {project.description ? (
                  <p className="min-w-0 flex-1 text-sm leading-relaxed text-[var(--al-muted)]">
                    {project.description}
                  </p>
                ) : (
                  <p className="text-sm text-[var(--al-muted)]">説明は未設定です。</p>
                )}
                {isOwner ? (
                  <div className="shrink-0">
                    <ProjectEditModal
                      projectId={project.id}
                      initialDescription={project.description}
                    />
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--al-muted)]">
                {project.pinned ? (
                  <span className="rounded-full border border-[color-mix(in_srgb,var(--al-accent)_25%,var(--al-border))] bg-[var(--al-accent-soft)] px-2 py-0.5 font-medium text-[var(--al-accent)]">
                    📌 ピン留め
                  </span>
                ) : null}
                <span>作成: {formatDate(project.created_at)}</span>
                <span>更新: {formatDate(project.updated_at)}</span>
                <span>資料: {files.length}件</span>
              </div>
            </div>
          </section>

        <section className="al-glass-card overflow-hidden">
            <div className="border-b border-[var(--al-border)] bg-[linear-gradient(135deg,var(--al-accent-soft)_0%,#fff_55%)] px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--al-accent)] shadow-sm ring-1 ring-[var(--al-border)]">
                  <FileText className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div>
                  <p className="al-section-eyebrow">Materials</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-[var(--al-ink)]">
                    登録済み資料
                  </h2>
                  <p className="mt-1 text-sm text-[var(--al-muted)]">
                    このプロジェクトに紐づく研究・資料の一覧です。
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4 bg-[var(--al-surface)]/40 p-4 sm:p-6">
          {fileFetchNotice ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              {fileFetchNotice}
            </p>
          ) : null}
          {debugErrorDetails.length > 0 ? (
            <pre className="rounded-md bg-white/80 p-2 text-xs text-red-700 ring-1 ring-[var(--al-border)]">
              {debugErrorDetails.join("\n")}
            </pre>
          ) : null}
          {files.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--al-border)] bg-[var(--al-surface)] p-4 text-sm text-[var(--al-muted)]">
              {isOwner
                ? "まだ資料がありません。上のボタンからこのプロジェクトに研究を追加してください。"
                : "まだ公開されている資料がありません。"}
            </p>
          ) : (
            <div className="space-y-4">
              {files.map((file) => {
                const signedUrl = signedMap.get(file.id) ?? null;
                return (
                  <article
                    key={file.id}
                    className="al-project-card w-full"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[var(--al-ink)] sm:text-base">{file.title}</h3>
                      <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-medium text-[var(--al-muted)] ring-1 ring-[var(--al-border)]">
                        {sourceLabel(file.sourceType)}
                      </span>
                    </div>

                    {file.summary ? (
                      <p className="text-sm leading-relaxed text-[var(--al-muted)]">{file.summary}</p>
                    ) : (
                      <p className="text-sm text-[var(--al-muted)]">要約は未設定です。</p>
                    )}

                    <div className="flex min-h-7 flex-wrap gap-1.5">
                      {file.tags.slice(0, 8).map((tag) => (
                        <span
                          key={`${file.id}-${tag}`}
                          className="al-tag-pill"
                        >
                          #{tag.replace(/^#/, "")}
                        </span>
                      ))}
                      {file.tags.length === 0 ? (
                        <span className="text-xs text-[var(--al-muted)]">タグ未設定</span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--al-muted)]">
                      <span>登録日: {formatDate(file.createdAt)}</span>
                      <span>図表メモ: {file.figureCount}件</span>
                      {file.fileName ? <span>ファイル: {file.fileName}</span> : null}
                    </div>

                    {file.rawText ? (
                      <details className="al-synopsis-box">
                        <summary className="cursor-pointer text-xs font-medium text-[var(--al-ink)]">
                          解析対象テキストを表示
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--al-muted)]">
                          {clipText(file.rawText, 2400)}
                        </p>
                      </details>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--al-border)]/80 pt-3">
                      {signedUrl ? (
                        <a
                          href={signedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-[var(--al-accent)] hover:underline"
                        >
                          PDFを開く
                        </a>
                      ) : null}
                      {isOwner ? (
                        <Link
                          href={`/research/new?projectId=${project.id}`}
                          className="text-xs font-medium text-[var(--al-muted)] hover:text-[var(--al-accent)]"
                        >
                          このプロジェクトに追加 →
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "不明";
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

function sourceLabel(sourceType: string): string {
  switch (sourceType) {
    case "pdf":
      return "PDF";
    case "text":
      return "テキスト";
    case "image":
      return "画像";
    default:
      return "その他";
  }
}

function clipText(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n...（続きは研究登録画面で確認できます）`;
}
