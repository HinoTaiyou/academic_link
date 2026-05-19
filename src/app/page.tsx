import { redirect } from "next/navigation";
import { isOnboardingIncomplete } from "@/lib/profile/onboarding";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("interest_tags, research_fields")
    .eq("id", user.id)
    .maybeSingle();

  if (isOnboardingIncomplete(profile)) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
