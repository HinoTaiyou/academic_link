import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { signupAction } from "@/lib/auth/actions";

export const metadata = {
  title: "新規登録 | Academic Link",
};

export default function SignupPage() {
  return (
    <AuthShell>
      <AuthForm mode="signup" action={signupAction} />
    </AuthShell>
  );
}
