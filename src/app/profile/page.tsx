import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
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
        </div>
      </div>
    </AppShell>
  );
}
