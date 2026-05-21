import { AppShell } from "@/components/layout/app-shell";
import type { SidebarNavKey } from "@/components/layout/app-sidebar";
import { getAuthenticatedShellData } from "@/lib/layout/authenticated-shell-data";

type Props = {
  active?: SidebarNavKey;
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
