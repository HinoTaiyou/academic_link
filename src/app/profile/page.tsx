import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileEditForm } from "./_components/profile-edit-form";
import { ProjectDashboardSection } from "../dashboard/_components/project-dashboard-section";
import {
  loadProfileProjectCards,
  toOwnerDashboardItems,
} from "../u/[id]/_lib/load-profile-projects";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "プロフィール | Academic Link",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: researchRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("real_name, department, grade, interest_tags, research_fields")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("research_posts")
      .select("id, title, summary, tags, created_at, project_id")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const researchForProjects = (researchRows ?? []).map((r) => ({
    id: r.id as string,
    title: (r.title as string) ?? "",
    summary: (r.summary as string) ?? "",
    tags: ((r.tags as string[]) ?? []) as string[],
    created_at: r.created_at as string,
    project_id: (r.project_id as string | null) ?? null,
  }));

  const projectCards = toOwnerDashboardItems(
    await loadProfileProjectCards(supabase, user.id, researchForProjects),
  );

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
