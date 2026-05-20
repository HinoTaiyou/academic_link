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

  const [postsRes, projectsRes, filesRes, profilesRes] = await Promise.all([
    grouped["research_post"] && grouped["research_post"].length
      ? supabase.from("research_posts").select("id,title,summary,tags,created_at").in("id", grouped["research_post"])
      : Promise.resolve({ data: [] }),
    grouped["project"] && grouped["project"].length
      ? supabase.from("projects").select("id,name,description,created_at,owner_id").in("id", grouped["project"])
      : Promise.resolve({ data: [] }),
    grouped["project_file"] && grouped["project_file"].length
      ? supabase
          .from("project_files")
          .select("id,title,summary,created_at,project_id,file_name")
          .in("id", grouped["project_file"])
      : Promise.resolve({ data: [] }),
    grouped["profile"] && grouped["profile"].length
      ? supabase
          .from("profiles")
          .select("id,real_name,department,grade")
          .in("id", grouped["profile"])
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
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold">保存</h1>
        <div className="mt-6">
          <BookmarkTabs profiles={profiles} posts={posts} projects={projects} files={files} />
        </div>
      </div>
    </AppShell>
  );
}
