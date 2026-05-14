import { AuthForm } from "../_components/auth-form";
import { AuthShell } from "../_components/auth-shell";
import { signupAction } from "../_lib/actions";

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
