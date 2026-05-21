import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "研究 | Academic Link" };

type Props = { params: Promise<{ id: string }> };

export default async function ResearchPostPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const readClient = createAdminClient() ?? supabase;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // require login to view research posts in this app
    redirect("/login");
  }

  const { data: post } = await readClient
    .from("research_posts")
    .select("id, title, summary, raw_text, author_id, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!post) return notFound();

  const { data: author } = await readClient
    .from("profiles")
    .select("id, real_name, department, grade")
    .eq("id", post.author_id)
    .maybeSingle();

  return (
    <AuthenticatedAppShell active="research">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="al-glass-card overflow-hidden">
          <div className="border-b border-[var(--al-border)] bg-[linear-gradient(135deg,var(--al-accent-soft)_0%,#fff_55%)] px-5 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <p className="al-section-eyebrow">Research</p>
              <h1 className="mt-1 text-lg font-semibold tracking-tight text-[var(--al-ink)] sm:text-xl">{post.title}</h1>
              <p className="mt-1 text-sm leading-relaxed text-[var(--al-muted)]">{post.summary}</p>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: String(post.raw_text || post.summary || "") }} />
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-[var(--al-muted)]">
                投稿者: {author ? <Link href={`/u/${author.id}`} className="text-[var(--al-accent)]">{author.real_name ?? "（名前未設定）"}</Link> : "不明"}
              </div>
              <div className="text-xs text-[var(--al-muted)]">{new Date(post.created_at).toLocaleString()}</div>
            </div>
          </div>
        </section>
      </div>
    </AuthenticatedAppShell>
  );
}
