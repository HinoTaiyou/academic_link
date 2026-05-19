import { redirect } from "next/navigation";
import { OnboardingForm } from "./_components/onboarding-form";
import { OnboardingShell } from "./_components/onboarding-shell";
import { createClient } from "@/lib/supabase/server";
import { isOnboardingIncomplete } from "@/lib/profile/onboarding";

export const metadata = {
  title: "プロフィール設定 | Academic Link",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("real_name, department, grade, interest_tags, research_fields")
    .eq("id", user.id)
    .maybeSingle();

  if (!isOnboardingIncomplete(profile)) {
    redirect("/dashboard");
  }

  return (
    <OnboardingShell>
      <OnboardingForm
        initialInterestTags={profile?.interest_tags ?? []}
        initialResearchFields={profile?.research_fields ?? []}
        initialRealName={profile?.real_name ?? ""}
        initialDepartment={profile?.department ?? ""}
        initialGrade={profile?.grade ?? ""}
      />
    </OnboardingShell>
  );
}
