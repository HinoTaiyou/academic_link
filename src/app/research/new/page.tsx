import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ResearchNewForm } from "@/components/research/research-new-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "研究を登録 | Academic Link",
};

export default async function NewResearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("real_name, department, grade, interest_tags")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AppShell
      active="research"
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
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              研究を登録
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              PDF（論文・スライド等）または貼り付けたテキストを AI で要約し、
              プロフィールから他のメンバーに見てもらえる形にします。
            </p>
          </div>

          <ResearchNewForm />
        </div>
      </div>
    </AppShell>
  );
}
