"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm({ initialFirstName, initialLastName, email }: { initialFirstName: string; initialLastName: string; email: string }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    const { error } = await createClient().auth.updateUser({ data: { first_name: firstName.trim(), last_name: lastName.trim() } });
    setIsSaving(false);
    if (error) return setMessage(error.message);
    setMessage("Profile saved.");
    router.refresh();
  }

  return <form className="grid gap-5" onSubmit={saveProfile}>
    <div className="grid gap-2"><Label>Email</Label><Input value={email} disabled /></div>
    <div className="grid gap-2 sm:grid-cols-2 sm:gap-4"><div className="grid gap-2"><Label htmlFor="profile-first-name">First name</Label><Input id="profile-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required /></div><div className="grid gap-2"><Label htmlFor="profile-last-name">Last name</Label><Input id="profile-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required /></div></div>
    {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    <Button type="submit" className="w-fit" disabled={isSaving}>{isSaving ? "Saving..." : "Save profile"}</Button>
  </form>;
}
