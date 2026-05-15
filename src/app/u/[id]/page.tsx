import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileView } from "./_components/profile-view";
import {
  ResearchList,
  type ResearchListItem,
} from "./_components/research-list";
import { ProjectDashboardSection } from "../../dashboard/_components/project-dashboard-section";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "ユーザープロフィール | Academic Link",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: myProfile }, { data: researchRows }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, real_name, department, grade, interest_tags, research_fields")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("real_name, department, grade, interest_tags")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("research_posts")
        .select("id, title, summary, tags, file_name, pdf_path, created_at")
        .eq("author_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (!profile) {
    notFound();
  }

  const isMe = profile.id === user.id;
  const researchItems: ResearchListItem[] = (researchRows ?? []).map((r) => ({
    id: r.id as string,
    title: (r.title as string) ?? "",
    summary: (r.summary as string) ?? "",
    tags: ((r.tags as string[]) ?? []),
    file_name: (r.file_name as string | null) ?? null,
    pdf_path: (r.pdf_path as string | null) ?? null,
    created_at: r.created_at as string,
  }));

  // If viewing own profile, also fetch projects to show project dashboard instead of raw research list
  let projectCards: Array<{
    id: string;
    name: string;
    description: string;
    pinned: boolean;
    updatedAt: string;
    docTitle: string | null;
    docSummary: string | null;
    docTags: string[];
    figureCount: number;
  }> = [];
  if (isMe) {
    const [projectsRes, projectFilesRes] = await Promise.all([
      supabase
        .from("projects")
        .select("id, name, description, pinned, updated_at")
        .eq("owner_id", user.id)
        .eq("archived", false)
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false }),
      supabase
        .from("project_files")
        .select("project_id, title, summary, tags, figure_notes, created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const projects = projectsRes.error ? [] : (projectsRes.data ?? []);
    const projectFiles = projectFilesRes.error ? [] : (projectFilesRes.data ?? []);

    const latestByProject = new Map<string, (typeof projectFiles)[number]>();
    for (const row of projectFiles) {
      const pid = String(row.project_id ?? "");
      if (!pid || latestByProject.has(pid)) continue;
      latestByProject.set(pid, row);
    }

    projectCards = projects.map((p) => {
      const doc = latestByProject.get(p.id);
      const figureCount = Array.isArray(doc?.figure_notes) ? doc.figure_notes.length : 0;
      return {
        id: p.id,
        name: p.name,
        description: p.description ?? "",
        pinned: Boolean(p.pinned),
        updatedAt: p.updated_at,
        docTitle: doc?.title ?? null,
        docSummary: doc?.summary ?? null,
        docTags: (doc?.tags as string[] | null) ?? [],
        figureCount,
      };
    });
  }

  return (
    <AppShell
      active={isMe ? "profile" : undefined}
      profile={{
        id: user.id,
        realName: myProfile?.real_name ?? null,
        department: myProfile?.department ?? null,
        grade: myProfile?.grade ?? null,
        interestTags: myProfile?.interest_tags ?? [],
        email: user.email ?? null,
      }}
    >
      <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 md:py-10">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-slate-900">プロフィール</h1>
            <div className="flex gap-2">
              {!isMe ? (
                <Link
                  href={`/chat/${profile.id}`}
                  className="rounded-md bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:shadow-md hover:brightness-110"
                >
                  💬 メッセージを送る
                </Link>
              ) : null}
              {isMe ? (
                <Link
                  href="/profile"
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#667eea]/40 hover:text-[#667eea]"
                >
                  編集する
                </Link>
              ) : null}
            </div>
          </div>

          <ProfileView
            profile={{
              id: profile.id,
              realName: profile.real_name,
              department: profile.department,
              grade: profile.grade,
              interestTags: profile.interest_tags ?? [],
              researchFields: profile.research_fields ?? [],
            }}
          />

          {isMe ? (
            <ProjectDashboardSection items={projectCards} />
          ) : (
            <section className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">
                  📚 登録した研究
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    {researchItems.length}件
                  </span>
                </h2>
                {isMe ? (
                  <Link
                    href="/research/new"
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#667eea]/40 hover:text-[#667eea]"
                  >
                    ＋ 研究を追加
                  </Link>
                ) : null}
              </div>
              <ResearchList items={researchItems} isOwner={isMe} />
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
