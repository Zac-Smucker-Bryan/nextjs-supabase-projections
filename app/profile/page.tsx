import { AppShell } from "@/components/app-shell";
import { ProfileForm } from "@/components/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  await requireUser();
  const { data: { user } } = await (await createClient()).auth.getUser();
  const metadata = (user?.user_metadata ?? {}) as { first_name?: string; last_name?: string };

  return <AppShell><div className="max-w-xl"><h1 className="text-3xl font-semibold tracking-tight">Profile</h1><p className="mt-2 text-muted-foreground">Manage the name shown in your workspace.</p><Card className="mt-8"><CardHeader><CardTitle>Your details</CardTitle><CardDescription>This information is stored securely with your Supabase account.</CardDescription></CardHeader><CardContent><ProfileForm initialFirstName={metadata.first_name ?? ""} initialLastName={metadata.last_name ?? ""} email={user?.email ?? ""} /></CardContent></Card></div></AppShell>;
}
