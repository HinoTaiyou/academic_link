import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { NewsSection } from "./_components/news-section";
import { getNewsForInterests, getPopularNews } from "./_lib/news";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "ホーム | Academic Link",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("real_name, department, grade, interest_tags")
    .eq("id", user.id)
    .maybeSingle();

  const interests = (profile?.interest_tags ?? []) as string[];

  const [interestNews, popularNews] = await Promise.all([
    getNewsForInterests(interests, 9),
    getPopularNews(interests, 7),
  ]);

  return (
    <AppShell
      active="dashboard"
      profile={{
        id: user.id,
        realName: profile?.real_name ?? null,
        department: profile?.department ?? null,
        grade: profile?.grade ?? null,
        interestTags: interests,
        email: user.email ?? null,
      }}
    >
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
        <NewsSection
          variant="interest"
          title="あなたの興味に基づくニュース"
          description={
            interests.length
              ? "プロフィールの興味タグに合わせて Google ニュースから取得しています。"
              : "興味のあるタグを設定すると、関連ニュースがここに表示されます。"
          }
          interestTags={interests}
          emptyHint="関連するニュースがまだありません。タグを増やすと候補が広がります。"
          items={interestNews}
        />

        <NewsSection
          variant="popular"
          title="データサイエンス・プログラミングの注目ニュース"
          description="データサイエンス・プログラミングの最新情報をお届けします。"
          items={popularNews}
        />
      </div>
    </AppShell>
  );
}
