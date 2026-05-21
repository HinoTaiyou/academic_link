import { AppShell } from "@/components/layout/app-shell";
import { getAuthenticatedShellData } from "@/lib/layout/authenticated-shell-data";

type NavKey =
  | "dashboard"
  | "profile"
  | "members"
  | "research"
  | "research_search"
  | "chat"
  | "bookmarks";

type Props = {
  active?: NavKey;
  children: React.ReactNode;
};

export async function AuthenticatedAppShell({ active, children }: Props) {
  const { profile, quickProjects } = await getAuthenticatedShellData();

  return (
    <AppShell active={active} profile={profile} quickProjects={quickProjects}>
      {children}
    </AppShell>
  );
}
