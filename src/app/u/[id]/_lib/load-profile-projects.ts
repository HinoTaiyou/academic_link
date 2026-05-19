import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileProjectCard = {
  id: string;
  name: string;
  description: string;
  pinned: boolean;
  updatedAt: string;
  docTitle: string | null;
  docSummary: string | null;
  docTags: string[];
  figureCount: number;
  fileCount: number;
  qaResearchPostId: string | null;
  qaProjectId: string | null;
  /** プロジェクト詳細へのリンク（レガシー投稿のみ null） */
  viewHref: string | null;
};

type ResearchRow = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  created_at: string;
  project_id: string | null;
};

/** 公開プロフィールに載せる研究投稿（削除・アーカイブ済みプロジェクト配下は除外） */
export function filterPublicResearchRows(
  rows: ResearchRow[],
  activeProjectIds: Set<string>,
): ResearchRow[] {
  return rows.filter((r) => {
    if (!r.project_id) return true;
    return activeProjectIds.has(r.project_id);
  });
}

function legacyPostCards(rows: ResearchRow[]): ProfileProjectCard[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.title,
    description: r.summary.slice(0, 120),
    pinned: false,
    updatedAt: r.created_at,
    docTitle: r.title,
    docSummary: r.summary,
    docTags: r.tags,
    figureCount: 0,
    fileCount: 1,
    qaResearchPostId: r.id,
    qaProjectId: null,
    viewHref: null,
  }));
}

export async function loadProfileProjectCards(
  supabase: SupabaseClient,
  ownerId: string,
  researchRows: ResearchRow[],
): Promise<ProfileProjectCard[]> {
  const projectsRes = await supabase
    .from("projects")
    .select("id, name, description, pinned, updated_at")
    .eq("owner_id", ownerId)
    .eq("archived", false)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (projectsRes.error) {
    console.error("loadProfileProjectCards projects", projectsRes.error);
  }

  const projects = projectsRes.data ?? [];
  const activeProjectIds = new Set(projects.map((p) => p.id));
  const visibleResearch = filterPublicResearchRows(researchRows, activeProjectIds);

  if (projects.length === 0) {
    const legacyOnly = visibleResearch.filter((r) => !r.project_id);
    return legacyPostCards(legacyOnly);
  }

  const projectIds = [...activeProjectIds];
  const projectFilesRes = await supabase
    .from("project_files")
    .select("project_id, title, summary, tags, raw_text, figure_notes, created_at")
    .eq("owner_id", ownerId)
    .in("project_id", projectIds)
    .order("created_at", { ascending: false })
    .limit(200);

  if (projectFilesRes.error) {
    console.error("loadProfileProjectCards project_files", projectFilesRes.error);
  }

  const projectFiles = projectFilesRes.data ?? [];

  const latestByProject = new Map<string, (typeof projectFiles)[number]>();
  const fileCountByProject = new Map<string, number>();
  for (const row of projectFiles) {
    const pid = String(row.project_id ?? "");
    if (!pid) continue;
    fileCountByProject.set(pid, (fileCountByProject.get(pid) ?? 0) + 1);
    if (!latestByProject.has(pid)) latestByProject.set(pid, row);
  }

  const postByProject = new Map<string, ResearchRow>();
  for (const row of visibleResearch) {
    if (!row.project_id || postByProject.has(row.project_id)) continue;
    postByProject.set(row.project_id, row);
  }

  return projects.map((p) => {
    const doc = latestByProject.get(p.id);
    const linked = postByProject.get(p.id);
    const figureCount = Array.isArray(doc?.figure_notes)
      ? doc.figure_notes.length
      : 0;
    const hasDoc = Boolean(
      doc?.summary?.trim() || doc?.raw_text?.trim() || doc?.title?.trim(),
    );
    const hasText = Boolean(p.description?.trim() || p.name?.trim());

    let qaResearchPostId: string | null = linked?.id ?? null;
    let qaProjectId: string | null = null;
    if (!qaResearchPostId && (hasDoc || hasText)) {
      qaProjectId = p.id;
    }

    return {
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      pinned: Boolean(p.pinned),
      updatedAt: p.updated_at,
      docTitle: doc?.title ?? linked?.title ?? null,
      docSummary: doc?.summary ?? linked?.summary ?? null,
      docTags: (doc?.tags as string[] | null) ?? linked?.tags ?? [],
      figureCount,
      fileCount: fileCountByProject.get(p.id) ?? (linked ? 1 : 0),
      qaResearchPostId,
      qaProjectId,
      viewHref: `/projects/${p.id}`,
    };
  });
}

export function folderSubtitle(item: {
  description: string;
  docTags: string[];
}): string {
  const tags = item.docTags
    .slice(0, 3)
    .map((t) => t.replace(/^#/, "").toUpperCase())
    .join(", ");
  if (tags) return tags;
  const desc = item.description.trim();
  if (desc) return desc.slice(0, 48).toUpperCase();
  return "RESEARCH PROJECT";
}

export function toOwnerDashboardItems(cards: ProfileProjectCard[]) {
  return cards.map(
    ({ qaResearchPostId: _a, qaProjectId: _b, ...card }) => card,
  );
}
