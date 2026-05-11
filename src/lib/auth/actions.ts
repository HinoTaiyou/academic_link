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

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
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

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  return {
    message:
      "登録メールを送信しました。受信箱の確認リンクをクリックしてください。" +
      "（Supabase で「Confirm email」を OFF にしている場合はそのままログインできます。）",
  };
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
