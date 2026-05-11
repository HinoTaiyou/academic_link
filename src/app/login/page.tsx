import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { loginAction } from "@/lib/auth/actions";

export const metadata = {
  title: "ログイン | Academic Link",
};

export default function LoginPage() {
  return (
    <AuthShell>
      <AuthForm mode="login" action={loginAction} />
    </AuthShell>
  );
}
