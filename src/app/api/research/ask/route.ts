import { NextResponse } from "next/server";
import { answerResearchQuestion } from "@/lib/research-qa/answer";
import {
  loadResearchQaContextFromPost,
  loadResearchQaContextFromProject,
} from "@/lib/research-qa/load-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { researchPostId?: string; projectId?: string; question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエスト形式が不正です。" }, { status: 400 });
  }

  const researchPostId = body.researchPostId?.trim();
  const projectId = body.projectId?.trim();
  const question = body.question?.trim();

  if (!researchPostId && !projectId) {
    return NextResponse.json(
      { error: "研究 ID またはプロジェクト ID が必要です。" },
      { status: 400 },
    );
  }
  if (researchPostId && projectId) {
    return NextResponse.json({ error: "指定はどちらか一方にしてください。" }, { status: 400 });
  }
  if (!question) {
    return NextResponse.json({ error: "質問を入力してください。" }, { status: 400 });
  }
  if (question.length > 1000) {
    return NextResponse.json(
      { error: "質問は 1000 文字以内にしてください。" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const readClient = projectId ? (createAdminClient() ?? supabase) : supabase;
  const loaded = researchPostId
    ? await loadResearchQaContextFromPost(supabase, researchPostId)
    : await loadResearchQaContextFromProject(readClient, projectId!);

  if (!loaded.ok) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }

  if (loaded.authorId === user.id) {
    return NextResponse.json(
      { error: "自分の研究には編集画面から内容を更新してください。" },
      { status: 400 },
    );
  }

  try {
    const answer = await answerResearchQuestion(loaded.context, question);
    return NextResponse.json({
      answer,
      researchTitle: loaded.title,
      authorName: loaded.context.authorName,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "AI の応答生成に失敗しました。";
    console.error("research qa", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
