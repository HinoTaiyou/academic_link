import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  interest_tags_json?: string;
  research_fields_json?: string;
  real_name?: string;
  department?: string;
  grade?: string;
  student_number?: string | null;
};

function parseTags(raw?: string) {
  if (!raw) return [] as string[];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map((x) => String(x).trim()).filter(Boolean))];
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "認証情報が必要です" }, { status: 401 });

  let body: Body = {};
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const interestTags = parseTags(body.interest_tags_json);
  const researchFields = parseTags(body.research_fields_json);
  const realName = (body.real_name ?? "").toString().trim();
  const department = (body.department ?? "").toString().trim();
  const grade = (body.grade ?? "").toString().trim();
  const studentNumber = (body.student_number ?? null);

  if (interestTags.length === 0 && researchFields.length === 0) {
    return NextResponse.json({ error: "タグを1つ以上選択してください。" }, { status: 400 });
  }

  const payloadWithStudent = {
    student_number: studentNumber ?? null,
    real_name: realName || null,
    department: department || null,
    grade: grade || null,
    interest_tags: interestTags,
    research_fields: researchFields,
  };

  const res1 = await supabase.from("profiles").update(payloadWithStudent).eq("id", user.id);
  if (res1.error) {
    const msg = String(res1.error.message ?? "").toLowerCase();
    if (msg.includes("student_number") || msg.includes("could not find") || msg.includes("column \"student_number\"")) {
      const payload = {
        real_name: realName || null,
        department: department || null,
        grade: grade || null,
        interest_tags: interestTags,
        research_fields: researchFields,
      };
      const res2 = await supabase.from("profiles").update(payload).eq("id", user.id);
      if (res2.error) {
        console.error("profiles update retry", res2.error);
        return NextResponse.json({ error: "プロフィールの保存に失敗しました" }, { status: 500 });
      }
    } else {
      console.error("profiles update", res1.error);
      return NextResponse.json({ error: "プロフィールの保存に失敗しました" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
