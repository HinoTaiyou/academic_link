import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logoutAction } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "ダッシュボード | Academic Link",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-start justify-center bg-gradient-to-br from-slate-50 to-slate-200 p-6">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">ようこそ</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <dt className="font-medium text-muted-foreground">メールアドレス</dt>
            <dd className="sm:col-span-2">{user.email ?? "(未設定)"}</dd>

            <dt className="font-medium text-muted-foreground">User ID</dt>
            <dd className="break-all font-mono text-xs sm:col-span-2">{user.id}</dd>

            <dt className="font-medium text-muted-foreground">登録日時</dt>
            <dd className="sm:col-span-2">
              {new Date(user.created_at).toLocaleString("ja-JP")}
            </dd>
          </dl>

          <p className="rounded-md border bg-slate-50 p-3 text-sm text-slate-600">
            ログインに成功しました。次のステップで「プロフィール編集」「研究投稿」「メッセージ」などの画面を追加していきます。
          </p>

          <form action={logoutAction}>
            <Button type="submit" variant="outline">
              ログアウト
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
