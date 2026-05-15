import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileEditForm } from "./_components/profile-edit-form";
import { ProjectDashboardSection } from "../dashboard/_components/project-dashboard-section";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "プロフィール | Academic Link",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("real_name, department, grade, interest_tags, research_fields")
    .eq("id", user.id)
    .maybeSingle();

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

  const projectCards = projects.map((p) => {
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

  return (
    <AppShell
      active="profile"
      profile={{
        id: user.id,
        realName: profile?.real_name ?? null,
        department: profile?.department ?? null,
        grade: profile?.grade ?? null,
        interestTags: profile?.interest_tags ?? [],
        email: user.email ?? null,
      }}
    >
      <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 md:py-10">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                プロフィール編集
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                他のメンバーから見えるプロフィールを編集できます。
              </p>
            </div>
            <Link
              href={`/u/${user.id}`}
              className="text-xs font-medium text-[#667eea] hover:underline"
            >
              公開ビューを確認 →
            </Link>
          </div>

          <ProfileEditForm
            initialInterestTags={profile?.interest_tags ?? []}
            initialResearchFields={profile?.research_fields ?? []}
            initialRealName={profile?.real_name ?? ""}
            initialDepartment={profile?.department ?? ""}
            initialGrade={profile?.grade ?? ""}
          />
          <div className="pt-6">
            <ProjectDashboardSection items={projectCards} showHeader={false} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
