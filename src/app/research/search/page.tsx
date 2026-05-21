import { Search } from "lucide-react";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import ResearchSearch from "@/components/search/research-search";

export const metadata = { title: "研究検索 | Academic Link" };

export default async function SearchPage() {
  return (
    <AuthenticatedAppShell active="research_search">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="al-glass-card overflow-hidden">
          <div className="border-b border-[var(--al-border)] bg-[linear-gradient(135deg,var(--al-accent-soft)_0%,#fff_55%)] px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--al-accent)] shadow-sm ring-1 ring-[var(--al-border)]">
                <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="al-section-eyebrow">Research</p>
                <h1 className="mt-1 text-lg font-semibold tracking-tight text-[var(--al-ink)] sm:text-xl">研究検索</h1>
                <p className="mt-1 text-sm leading-relaxed text-[var(--al-muted)]">
                  キーワードで研究投稿を検索します。キーワードを入力して検索してください。
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <ResearchSearch />
          </div>
        </section>
      </div>
    </AuthenticatedAppShell>
  );
}
