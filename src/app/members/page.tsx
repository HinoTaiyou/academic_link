import { redirect } from "next/navigation";
import { Check, Search, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MemberCard } from "./_components/member-card";
import { TagFilterChips, type FilterType } from "./_components/tag-filter-chips";
import {
  buildFilterTagOptions,
  isAllowedFilterTag,
} from "./_lib/filter-tags";
import {
  normTag,
  scoreMember,
  sortMembers,
  type MemberProfileRow,
} from "./_lib/match";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "メンバー検索 | Academic Link",
};

type PageProps = {
  searchParams: Promise<{ tag?: string; type?: string }>;
};

export default async function MembersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filterType: FilterType =
    sp.type === "research" ? "research" : "interest";
  const rawTag = typeof sp.tag === "string" ? normTag(sp.tag) : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("real_name, department, grade, interest_tags, research_fields")
    .eq("id", user.id)
    .maybeSingle();

  const myInterest = (myProfile?.interest_tags ?? []) as string[];
  const myResearch = (myProfile?.research_fields ?? []) as string[];

  const { data: rows, error } = await supabase
    .from("profiles")
    .select("id, real_name, department, grade, interest_tags, research_fields")
    .neq("id", user.id);

  if (error) {
    console.error("members fetch", error);
  }

  const memberRows = (rows ?? []) as MemberProfileRow[];

  const interestFilterOptions = buildFilterTagOptions(
    memberRows,
    myInterest,
    "interest",
  );
  const researchFilterOptions = buildFilterTagOptions(
    memberRows,
    myResearch,
    "research",
  );

  const filterTag =
    rawTag &&
    isAllowedFilterTag(rawTag, memberRows, myInterest, myResearch, filterType)
      ? rawTag
      : null;

  let members = memberRows.map((r) =>
    scoreMember(myInterest, myResearch, r),
  );

  if (filterTag) {
    if (filterType === "research") {
      members = members.filter((m) =>
        (m.research_fields ?? []).some((t) => normTag(t) === filterTag),
      );
    } else {
      members = members.filter((m) =>
        (m.interest_tags ?? []).some((t) => normTag(t) === filterTag),
      );
    }
  }

  members.sort(sortMembers);

  const emptyMessage = filterTag
    ? `「${filterTag}」を${filterType === "research" ? "研究タグ" : "興味タグ"}に含むメンバーがまだいません。`
    : "表示できる他のメンバーがまだいません。";

  return (
    <AppShell
      active="members"
      profile={{
        id: user.id,
        realName: myProfile?.real_name ?? null,
        department: myProfile?.department ?? null,
        grade: myProfile?.grade ?? null,
        interestTags: myInterest,
        email: user.email ?? null,
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="al-glass-card overflow-hidden">
          <div className="border-b border-[var(--al-border)] bg-[linear-gradient(135deg,var(--al-accent-soft)_0%,#fff_55%)] px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--al-accent)] shadow-sm ring-1 ring-[var(--al-border)]">
                <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="al-section-eyebrow">Members</p>
                <h1 className="mt-1 text-lg font-semibold tracking-tight text-[var(--al-ink)] sm:text-xl">
                  メンバー検索
                </h1>
                <p className="mt-1 text-sm leading-relaxed text-[var(--al-muted)]">
                  あなたのタグとの
                  <span className="font-medium text-[var(--al-ink)]">
                    共通数が多い順
                  </span>
                  に表示しています。カードをクリックすると公開プロフィールへ移動します。
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 border-b border-[var(--al-border)] bg-[var(--al-surface)]/50 p-4 sm:p-5">
            <TagFilterChips
              interestOptions={interestFilterOptions}
              researchOptions={researchFilterOptions}
              selectedTag={filterTag}
              filterType={filterType}
            />
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[var(--al-muted)]">
              <span className="inline-flex items-center gap-1">
                <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--al-accent-soft)] px-1.5 py-px text-[var(--al-accent)] ring-1 ring-[color-mix(in_srgb,var(--al-accent)_30%,var(--al-border))]">
                  <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
                  タグ
                </span>
                あなたと共通
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="rounded-full bg-white px-1.5 py-px text-[var(--al-muted)] ring-1 ring-[var(--al-border)]">
                  タグ
                </span>
                相手のみ
              </span>
            </p>
          </div>

          <div className="p-4 sm:p-5">
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--al-border)] bg-[var(--al-surface)] px-6 py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--al-muted)] ring-1 ring-[var(--al-border)]">
                  <Users className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                </span>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--al-muted)]">
                  {emptyMessage}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {members.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    myInterestTags={myInterest}
                    myResearchTags={myResearch}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
