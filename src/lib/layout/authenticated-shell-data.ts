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

  const quickProjects = await loadSidebarProjects(supabase, user.id);

  return {
    profile: { id: user.id },
    quickProjects,
  };
}
