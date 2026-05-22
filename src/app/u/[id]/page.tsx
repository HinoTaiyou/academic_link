import Link from "next/link";
import { FolderOpen, MessageSquare, Pencil } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { AppMain } from "@/components/layout/app-main";
import { FollowButton } from "@/components/profile/follow-button";
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

  const [{ data: profile }, { data: researchRows }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, real_name, department, grade, interest_tags, research_fields")
        .eq("id", id)
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
  const bookmarkClient = createAdminClient() ?? supabase;

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

  const followStatus = isMe
    ? null
    : await bookmarkClient
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("target_type", "profile")
        .eq("target_id", profile.id)
        .maybeSingle();

  return (
    <AuthenticatedAppShell active={isMe ? "profile" : undefined}>
      <AppMain className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-[var(--al-ink)]">プロフィール</h1>
            <div className="flex gap-2">
              {!isMe ? (
                <FollowButton
                  targetUserId={profile.id}
                  initialFollowing={Boolean(followStatus?.data?.id)}
                />
              ) : null}
              {!isMe ? (
                <Link
                  href={`/chat/${profile.id}`}
                  className="al-btn-gradient inline-flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <MessageSquare className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  メッセージを送る
                </Link>
              ) : null}
              {isMe ? (
                <Link
                  href="/profile"
                  className="al-btn-outline inline-flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
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
          <section className="al-glass-card">
            <div className="border-b border-[var(--al-border)] bg-[linear-gradient(135deg,var(--al-accent-soft)_0%,#fff_55%)] px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--al-accent)] shadow-sm ring-1 ring-[var(--al-border)]">
                  <FolderOpen
                    className="h-5 w-5"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
                <div>
                  <p className="al-section-eyebrow">Files</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-[var(--al-ink)]">
                    プロジェクト・資料
                  </h2>
                  <p className="mt-1 text-sm text-[var(--al-muted)]">
                    あなたの研究プロジェクトと登録資料です。
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-visible bg-[var(--al-surface)]/40 p-4 pt-3 sm:p-6 sm:pt-4">
              <ProjectDashboardSection
                items={ownerDashboardItems}
                showHeader={false}
                compact
              />
            </div>
          </section>
        ) : (
          <section className="al-glass-card">
            <div className="border-b border-[var(--al-border)] bg-[linear-gradient(135deg,var(--al-accent-soft)_0%,#fff_55%)] px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--al-accent)] shadow-sm ring-1 ring-[var(--al-border)]">
                  <FolderOpen
                    className="h-5 w-5"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
                <div>
                  <p className="al-section-eyebrow">Files</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-[var(--al-ink)]">
                    プロジェクト・資料
                  </h2>
                  <p className="mt-1 text-sm text-[var(--al-muted)]">
                    {profileDisplayName}
                    さんの研究プロジェクトと登録資料です。
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-visible bg-[var(--al-surface)]/40 p-4 pt-3 sm:p-6 sm:pt-4">
              <ProjectDashboardBrowse
                items={projectCards}
                authorName={profileDisplayName}
                compact
              />
            </div>
          </section>
        )}
      </AppMain>
    </AuthenticatedAppShell>
  );
}
