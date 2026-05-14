import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MemberCard } from "./_components/member-card";
import { TagFilterChips } from "./_components/tag-filter-chips";
import { dsProgrammingTags } from "@/lib/constants/profile";
import {
  scoreMember,
  sortMembers,
  type MemberProfileRow,
} from "./_lib/match";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "メンバー検索 | Academic Link",
};

type PageProps = {
  searchParams: Promise<{ tag?: string }>;
};

export default async function MembersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const rawTag = typeof sp.tag === "string" ? sp.tag.trim() : "";
  const tagSet = new Set(dsProgrammingTags as readonly string[]);
  const filterTag =
    rawTag && tagSet.has(rawTag) ? rawTag : null;

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

  let members = (rows ?? []).map((r) =>
    scoreMember(
      myInterest,
      myResearch,
      r as MemberProfileRow,
    ),
  );

  if (filterTag) {
    members = members.filter((m) =>
      m.interest_tags.some((t) => t.replace(/^#/, "").trim() === filterTag),
    );
  }

  members.sort(sortMembers);

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
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            メンバー検索
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            あなたの興味タグとの<strong className="font-medium text-slate-700">
              共通数が多い順
            </strong>
            に並べています。カードをクリックすると公開プロフィールへ移動します。
          </p>
        </div>

        <TagFilterChips
          tags={
            myInterest.length > 0 ? myInterest : [...dsProgrammingTags]
          }
          selectedTag={filterTag}
        />

        {members.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-muted-foreground">
            {filterTag
              ? `「${filterTag}」を興味タグに含むメンバーがまだいません。`
              : "表示できる他のメンバーがまだいません。"}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {members.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
