import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileView } from "./_components/profile-view";
import { ProjectDashboardBrowse } from "./_components/project-dashboard-browse";
import { ProjectDashboardSection } from "../../dashboard/_components/project-dashboard-section";
import {
  loadProfileProjectCards,
  toOwnerDashboardItems,
} from "./_lib/load-profile-projects";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "ユーザープロフィール | Academic Link",
};

export const dynamic = "force-dynamic";

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
        .select(
          "id, title, summary, tags, file_name, pdf_path, created_at, project_id",
        )
        .eq("author_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (!profile) {
    notFound();
  }

  const isMe = profile.id === user.id;
  const profileDisplayName =
    (profile.real_name as string | null)?.trim() || "研究者";

  const researchForProjects = (researchRows ?? []).map((r) => ({
    id: r.id as string,
    title: (r.title as string) ?? "",
    summary: (r.summary as string) ?? "",
    tags: ((r.tags as string[]) ?? []) as string[],
    created_at: r.created_at as string,
    project_id: (r.project_id as string | null) ?? null,
  }));

  const projectReadClient = isMe ? supabase : (createAdminClient() ?? supabase);
  const projectCards = await loadProfileProjectCards(
    projectReadClient,
    profile.id,
    researchForProjects,
  );
  const ownerDashboardItems = toOwnerDashboardItems(projectCards);

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
            <ProjectDashboardSection items={ownerDashboardItems} />
          ) : (
            <section className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    📁 プロジェクトダッシュボード
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {profileDisplayName}
                    さんの研究プロジェクトと最新資料です。
                  </p>
                </div>
              </div>
              <ProjectDashboardBrowse
                items={projectCards}
                authorName={profileDisplayName}
              />
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
