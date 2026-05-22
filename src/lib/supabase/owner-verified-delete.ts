import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

type OwnerDeleteOptions = {
  table: "projects" | "project_files" | "research_posts";
  ownerId: string;
  /** projects / project_files は owner_id、research_posts は author_id */
  ownerColumn?: "owner_id" | "author_id";
  filters: Record<string, string>;
};

/**
 * 所有者確認済みの行を削除。RLS で 0 件になる場合は service role で再試行する。
 */
export async function deleteRowsAsOwner(
  userClient: SupabaseClient,
  opts: OwnerDeleteOptions,
): Promise<{ ok: boolean; deletedIds: string[]; error?: string }> {
  const ownerColumn = opts.ownerColumn ?? "owner_id";

  async function runDelete(client: SupabaseClient) {
    let query = client.from(opts.table).delete().select("id");
    for (const [key, value] of Object.entries(opts.filters)) {
      query = query.eq(key, value);
    }
    return query.eq(ownerColumn, opts.ownerId);
  }

  const userRes = await runDelete(userClient);
  if (userRes.error) {
    console.error(`delete ${opts.table} (user)`, userRes.error);
    return { ok: false, deletedIds: [], error: userRes.error.message };
  }

  const userIds = (userRes.data ?? []).map((row) => String(row.id));
  if (userIds.length > 0) {
    return { ok: true, deletedIds: userIds };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      deletedIds: [],
      error: "削除に失敗しました。Supabase の DELETE ポリシーまたは SERVICE_ROLE_KEY を確認してください。",
    };
  }

  const adminRes = await runDelete(admin);
  if (adminRes.error) {
    console.error(`delete ${opts.table} (admin)`, adminRes.error);
    return { ok: false, deletedIds: [], error: adminRes.error.message };
  }

  const adminIds = (adminRes.data ?? []).map((row) => String(row.id));
  if (adminIds.length === 0) {
    return { ok: false, deletedIds: [], error: "削除対象が見つかりませんでした" };
  }

  return { ok: true, deletedIds: adminIds };
}
