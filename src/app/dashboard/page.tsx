import { redirect } from "next/navigation";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { AppMain } from "@/components/layout/app-main";
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
    .select("interest_tags")
    .eq("id", user.id)
    .maybeSingle();

  const interests = (profile?.interest_tags ?? []) as string[];

  const [interestNews, popularNews] = await Promise.all([
    getNewsForInterests(interests, 9),
    getPopularNews(interests, 7),
  ]);

  return (
    <AuthenticatedAppShell active="dashboard">
      <AppMain className="space-y-8">
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
      </AppMain>
    </AuthenticatedAppShell>
  );
}
