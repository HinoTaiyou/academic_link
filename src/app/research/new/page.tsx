import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ResearchNewForm } from "./_components/research-new-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "研究を登録 | Academic Link",
};

type Props = {
  searchParams: Promise<{ projectId?: string }>;
};

export default async function NewResearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const requestedProjectId =
    typeof sp.projectId === "string" ? sp.projectId.trim() : "";

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

  const { data: projectsData } = await supabase
    .from("projects")
    .select("id, name")
    .eq("owner_id", user.id)
    .eq("archived", false)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  const projects = (projectsData ?? []) as Array<{ id: string; name: string }>;
  const activeProjectId = projects.some((p) => p.id === requestedProjectId)
    ? requestedProjectId
    : undefined;

  return (
    <AppShell
      active="research"
      activeProjectId={activeProjectId}
      quickProjects={projects.map((p) => ({ id: p.id, name: p.name }))}
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

          <ResearchNewForm projects={projects} initialProjectId={activeProjectId} />
        </div>
      </div>
    </AppShell>
  );
}
