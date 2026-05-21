import { redirect } from "next/navigation";
import { loadSidebarProjects } from "@/lib/projects/load-sidebar-projects";
import type { SidebarProfile } from "@/components/layout/app-sidebar";
import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedShellData(): Promise<{
  profile: SidebarProfile;
  quickProjects: Awaited<ReturnType<typeof loadSidebarProjects>>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("real_name, department, grade, interest_tags")
    .eq("id", user.id)
    .maybeSingle();

  const quickProjects = await loadSidebarProjects(supabase, user.id);

  return {
    profile: {
      id: user.id,
      realName: profileRow?.real_name ?? null,
      department: profileRow?.department ?? null,
      grade: profileRow?.grade ?? null,
      interestTags: (profileRow?.interest_tags ?? []) as string[],
      email: user.email ?? null,
    },
    quickProjects,
  };
}
