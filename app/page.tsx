import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createServerClient()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  } else {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", data.user.id)
      .single()

    if (!profile) {
      redirect("/setup-profile")
    } else {
      redirect("/avisos")
    }
  }
}
