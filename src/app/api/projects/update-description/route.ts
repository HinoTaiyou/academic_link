import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const projectId = String(body.projectId ?? "").trim();
    const description = String(body.description ?? "").trim();

    if (!projectId) return NextResponse.json({ ok: false, error: "projectId required" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "not authenticated" }, { status: 401 });

    // Ensure ownership
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', projectId)
      .maybeSingle();

    if (projErr) {
      console.error('project select', projErr);
      return NextResponse.json({ ok: false, error: 'failed to read project' }, { status: 500 });
    }
    if (!project || project.owner_id !== user.id) {
      return NextResponse.json({ ok: false, error: 'not owner' }, { status: 403 });
    }

    // Try update using admin client when available to avoid RLS surprises.
    const admin = createAdminClient();
    let updated = null;
    let updErr = null;

    if (admin) {
      const res = await admin
        .from('projects')
        .update({ description })
        .eq('id', projectId)
        .select('id, description')
        .maybeSingle();
      console.log('admin update res:', res);
      updated = res.data ?? null;
      updErr = res.error ?? null;
    } else {
      // As a safer fallback, include owner_id in the condition to be explicit.
      const res = await supabase
        .from('projects')
        .update({ description })
        .eq('id', projectId)
        .eq('owner_id', user.id)
        .select('id, description')
        .maybeSingle();
      console.log('supabase update res:', res);
      updated = res.data ?? null;
      updErr = res.error ?? null;
    }

    if (updErr) {
      console.error('project update', updErr);
      return NextResponse.json({ ok: false, error: 'failed to update' }, { status: 500 });
    }

    // Read back the row to verify persisted value
    try {
      const reader = admin ?? supabase;
      const { data: verifyRow, error: verifyErr } = await reader
        .from('projects')
        .select('id, description, owner_id')
        .eq('id', projectId)
        .maybeSingle();
      console.log('verify after update:', { verifyRow, verifyErr, usedAdmin: Boolean(admin) });
    } catch (e) {
      console.error('verify read failed', e);
    }

    // Debug logs: show request and DB results to trace why update may be null
    console.log("update-description request:", { projectId, userId: user.id, description });
    console.log("project selected:", project);
    console.log("project update result:", { updated, updErr });
    try {
      revalidatePath(`/projects/${projectId}`);
      revalidatePath(`/dashboard`);
      revalidatePath(`/u/${user.id}`);
    } catch (e) {
      // non-fatal; log for debugging
      console.error("revalidatePath failed", e);
    }

    return NextResponse.json({ ok: true, project: updated });
  } catch (err) {
    console.error('update-description route', err);
    return NextResponse.json({ ok: false, error: 'unexpected error' }, { status: 500 });
  }
}
