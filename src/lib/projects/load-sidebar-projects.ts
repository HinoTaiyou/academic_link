import type { SupabaseClient } from "@supabase/supabase-js";

export type SidebarProject = {
  id: string;
  name: string;
  pinned: boolean;
};

export async function loadSidebarProjects(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<SidebarProject[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, pinned")
    .eq("owner_id", ownerId)
    .eq("archived", false)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("loadSidebarProjects", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? "無題"),
    pinned: Boolean(row.pinned),
  }));
}
