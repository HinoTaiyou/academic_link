import { redirect } from "next/navigation";
import { FlaskConical } from "lucide-react";
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
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        <header className="al-glass-card overflow-hidden">
          <div className="border-b border-[var(--al-border)] bg-[linear-gradient(135deg,var(--al-accent-soft)_0%,#fff_55%)] px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--al-accent)] shadow-sm ring-1 ring-[var(--al-border)]">
                <FlaskConical
                  className="h-5 w-5"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="al-section-eyebrow">Research</p>
                <h1 className="mt-1 text-lg font-semibold tracking-tight text-[var(--al-ink)] sm:text-xl">
                  研究を登録
                </h1>
                <p className="mt-1 text-sm leading-relaxed text-[var(--al-muted)]">
                  PDF（論文・スライド等）またはテキストを AI
                  で要約し、プロフィールから他のメンバーに見てもらえる形にします。
                </p>
              </div>
            </div>
          </div>
        </header>

        <ResearchNewForm
          projects={projects}
          initialProjectId={activeProjectId}
        />
      </div>
    </AppShell>
  );
}
