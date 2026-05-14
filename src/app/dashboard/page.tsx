import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { NewsSection } from "./_components/news-section";
import { ProjectDashboardSection } from "./_components/project-dashboard-section";
import { getNewsForInterests, getPopularNews } from "./_lib/news";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "ホーム | Academic Link",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("real_name, department, grade, interest_tags")
    .eq("id", user.id)
    .maybeSingle();

  const interests = (profile?.interest_tags ?? []) as string[];

  const [interestNews, popularNews, projectsRes, projectFilesRes] = await Promise.all([
    getNewsForInterests(interests, 8),
    getPopularNews(interests, 6),
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
      active="dashboard"
      quickProjects={projects.map((p) => ({ id: p.id, name: p.name, pinned: Boolean(p.pinned) }))}
      profile={{
        id: user.id,
        realName: profile?.real_name ?? null,
        department: profile?.department ?? null,
        grade: profile?.grade ?? null,
        interestTags: interests,
        email: user.email ?? null,
      }}
    >
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
        <ProjectDashboardSection items={projectCards} />

        <NewsSection
          title="💛 あなたの興味に基づくニュース"
          description={
            interests.length
              ? `タグ: ${interests.join(" / ")}`
              : "興味のあるタグを設定すると、関連ニュースがここに表示されます。"
          }
          emptyHint="関連するニュースがまだありません。タグを増やすと候補が広がります。"
          items={interestNews}
        />

        <NewsSection
          title="🔥 データサイエンスの注目ニュース"
          description="Google ニュース「テクノロジー」のヘッドラインから自動取得"
          items={popularNews}
        />
      </div>
    </AppShell>
  );
}
