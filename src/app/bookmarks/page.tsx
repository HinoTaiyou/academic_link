import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import BookmarkTabs from "@/components/bookmarks/bookmark-tabs";

export const metadata = { title: "ブックマーク | Academic Link" };

type BookmarkRow = {
  target_type: "research_post" | "project" | "project_file" | "profile";
  target_id: string;
  created_at: string;
};

type ProfileBookmark = {
  id: string;
  real_name: string | null;
  department: string | null;
  grade: string | null;
};

type ResearchBookmark = {
  id: string;
  title: string;
  summary: string | null;
};

type ProjectBookmark = {
  id: string;
  name: string;
  description: string | null;
};

type FileBookmark = {
  id: string;
  title: string;
  summary: string | null;
  project_id: string;
};

export default async function BookmarksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return notFound();

  const { data: rows } = await supabase
    .from("bookmarks")
    .select("target_type, target_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const grouped = ((rows ?? []) as BookmarkRow[]).reduce(
    (acc: Record<string, string[]>, r) => {
      acc[r.target_type] = acc[r.target_type] ?? [];
      acc[r.target_type].push(r.target_id);
      return acc;
    },
    {},
  );

  // Helper: some older data or variants might store slightly different target_type
  // strings (e.g. "research_posts"). Provide a tolerant lookup.
  const getGroupIds = (substr: string) => {
    if (grouped[substr] && grouped[substr].length) return grouped[substr];
    const k = Object.keys(grouped).find((kk) => kk.includes(substr));
    return (k && grouped[k]) || [];
  };

  const [postsRes, projectsRes, filesRes, profilesRes] = await Promise.all([
    getGroupIds("research_post").length
      ? supabase.from("research_posts").select("id,title,summary,tags,created_at").in("id", getGroupIds("research_post"))
      : Promise.resolve({ data: [] }),
    getGroupIds("project").length
      ? supabase.from("projects").select("id,name,description,created_at,owner_id").in("id", getGroupIds("project"))
      : Promise.resolve({ data: [] }),
    getGroupIds("project_file").length
      ? supabase
          .from("project_files")
          .select("id,title,summary,created_at,project_id,file_name")
          .in("id", getGroupIds("project_file"))
      : Promise.resolve({ data: [] }),
    getGroupIds("profile").length
      ? supabase
          .from("profiles")
          .select("id,real_name,department,grade")
          .in("id", getGroupIds("profile"))
      : Promise.resolve({ data: [] }),
  ]);

  const posts = (postsRes.data ?? []) as ResearchBookmark[];
  const projects = (projectsRes.data ?? []) as ProjectBookmark[];
  const files = (filesRes.data ?? []) as FileBookmark[];
  const profiles = (profilesRes.data ?? []) as ProfileBookmark[];

  return (
    <AppShell
      active="bookmarks"
      profile={{ id: user.id, realName: null, department: null, grade: null, interestTags: [], email: user.email ?? null }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="al-glass-card overflow-hidden">
          <div className="border-b border-[var(--al-border)] bg-[linear-gradient(135deg,var(--al-accent-soft)_0%,#fff_55%)] px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start gap-3">
              <div className="min-w-0">
                <p className="al-section-eyebrow">Bookmarks</p>
                <h1 className="mt-1 text-lg font-semibold tracking-tight text-[var(--al-ink)] sm:text-xl">保存</h1>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <BookmarkTabs profiles={profiles} posts={posts} projects={projects} files={files} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
