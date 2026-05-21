"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useActionState, useState } from "react";
import type { AuthState } from "../_lib/actions";

type Mode = "login" | "signup";

type Props = {
  mode: Mode;
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
};

const COPY: Record<
  Mode,
  {
    headline: string;
    subline: string;
    submit: string;
    submitting: string;
    altText: string;
    altLinkText: string;
    altHref: string;
  }
> = {
  login: {
    headline: "Academic Link へようこそ",
    subline: "メールアドレスとパスワードでログインしてください。",
    submit: "ログイン",
    submitting: "ログイン中…",
    altText: "アカウントをお持ちでないですか？",
    altLinkText: "新規登録",
    altHref: "/signup",
  },
  signup: {
    headline: "研究と知見を、わかりやすくつなぐ",
    subline: "メールアドレスとパスワードで、Academic Link をはじめましょう。",
    submit: "アカウントを作成",
    submitting: "作成中…",
    altText: "すでにアカウントをお持ちですか？",
    altLinkText: "ログイン",
    altHref: "/login",
  },
};

export function AuthForm({ mode, action }: Props) {
  const copy = COPY[mode];
  const [state, formAction] = useActionState<AuthState, FormData>(action, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      <header className="mb-8 space-y-3 lg:mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--al-ink)] sm:text-3xl lg:text-[2rem] lg:leading-tight">
          {copy.headline}
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-[var(--al-muted)] sm:text-base">
          {copy.subline}
        </p>
      </header>

      <form action={formAction} className="space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-[var(--al-ink)]"
          >
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@university.ac.jp"
            required
            className="al-auth-input"
          />
        </div>

        {mode === "signup" ? (
          <div className="space-y-2">
            <label
              htmlFor="student_number"
              className="text-sm font-medium text-[var(--al-ink)]"
            >
              学籍番号
            </label>
            <input
              id="student_number"
              name="student_number"
              type="text"
              placeholder="例: S1234567"
              required
              className="al-auth-input"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-[var(--al-ink)]"
          >
            パスワード
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              placeholder={mode === "signup" ? "6 文字以上" : ""}
              minLength={6}
              required
              className="al-auth-input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--al-muted)] hover:text-[var(--al-ink)]"
              aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {state.error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        {state.message ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
            {state.message}
          </p>
        ) : null}

        <SubmitButton submit={copy.submit} submitting={copy.submitting} />

        <p className="text-center text-sm text-[var(--al-muted)]">
          {copy.altText}{" "}
          <Link
            href={copy.altHref}
            className="font-medium text-[var(--al-accent)] underline-offset-4 hover:underline"
          >
            {copy.altLinkText}
          </Link>
        </p>
      </form>
    </div>
  );
}

function SubmitButton({
  submit,
  submitting,
}: {
  submit: string;
  submitting: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="al-btn-gradient h-12 w-full text-sm disabled:opacity-60"
    >
      {pending ? submitting : submit}
    </button>
  );
}
