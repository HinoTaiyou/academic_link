"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthState } from "@/lib/auth/actions";

type Mode = "login" | "signup";

type Props = {
  mode: Mode;
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
};

const COPY: Record<
  Mode,
  {
    title: string;
    description: string;
    submit: string;
    submitting: string;
    altText: string;
    altLinkText: string;
    altHref: string;
  }
> = {
  login: {
    title: "ログイン",
    description: "メールアドレスとパスワードでログインします。",
    submit: "ログイン",
    submitting: "ログイン中…",
    altText: "アカウントをお持ちでないですか？",
    altLinkText: "新規登録",
    altHref: "/signup",
  },
  signup: {
    title: "新規登録",
    description: "メールアドレスとパスワードでアカウントを作成します。",
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

  return (
    <Card className="w-full gap-0 rounded-2xl bg-white py-0 shadow-2xl ring-1 ring-black/5">
      <CardHeader className="space-y-2 px-8 pt-8 pb-2 text-center">
        <CardTitle className="bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] bg-clip-text text-2xl font-bold text-transparent">
          {copy.title}
        </CardTitle>
        <CardDescription className="text-sm">{copy.description}</CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-5 px-8 py-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold tracking-wide uppercase text-slate-600">
              メールアドレス
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-semibold tracking-wide uppercase text-slate-600">
              パスワード
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={mode === "signup" ? "6 文字以上" : ""}
              minLength={6}
              required
              className="h-11"
            />
          </div>

          {state.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}

          {state.message ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {state.message}
            </p>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-col gap-4 rounded-b-2xl border-t-0 bg-transparent px-8 pt-2 pb-8">
          <SubmitButton submit={copy.submit} submitting={copy.submitting} />
          <p className="text-sm text-muted-foreground">
            {copy.altText}{" "}
            <Link
              href={copy.altHref}
              className="font-semibold text-[#667eea] underline-offset-4 hover:underline"
            >
              {copy.altLinkText}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
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
    <Button
      type="submit"
      className="h-11 w-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-base font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:opacity-60"
      disabled={pending}
    >
      {pending ? submitting : submit}
    </Button>
  );
}
