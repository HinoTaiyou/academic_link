import { AuthForm } from "../_components/auth-form";
import { AuthShell } from "../_components/auth-shell";
import { loginAction } from "../_lib/actions";

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
