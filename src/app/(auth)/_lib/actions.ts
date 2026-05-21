"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  message?: string;
};

function readEmail(formData: FormData): string {
  return (formData.get("email") as string | null)?.trim() ?? "";
}

function readPassword(formData: FormData): string {
  return (formData.get("password") as string | null) ?? "";
}

function readStudentNumber(formData: FormData): string {
  return (formData.get("student_number") as string | null)?.trim() ?? "";
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = readEmail(formData);
  const password = readPassword(formData);

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = readEmail(formData);
  const password = readPassword(formData);
  const studentNumber = readStudentNumber(formData);

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }
  if (!studentNumber) {
    return { error: "学籍番号を入力してください。" };
  }
  if (password.length < 6) {
    return { error: "パスワードは 6 文字以上にしてください。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getOrigin()}/auth/callback`,
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  // If signup immediately returns a session (e.g. no email confirmation required),
  // upsert the student_number into profiles. If not, the user can set it later
  // from profile edit / onboarding.
  try {
    if (data?.user && data?.session) {
      await supabase.from("profiles").upsert(
        { id: data.user.id, student_number: studentNumber },
        { onConflict: "id" },
      );
    }
  } catch (e) {
    console.error("upsert student_number after signup", e);
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }
  return { error: "ユーザー登録に失敗しました。不明なエラーが発生しました。" };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

function getOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000"
  );
}

function translateAuthError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }
  if (m.includes("email not confirmed")) {
    return "メール確認が完了していません。受信箱の確認リンクを開いてください。";
  }
  if (
    m.includes("user already registered") ||
    m.includes("user already exists") ||
    m.includes("email already")
  ) {
    return "このメールアドレスは既に登録済みです。ログインしてください。";
  }
  return raw;
}
