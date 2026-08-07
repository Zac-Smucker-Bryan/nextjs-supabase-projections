import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;
  const metadata = user?.user_metadata as
    | { first_name?: string; last_name?: string }
    | undefined;
  const displayName = [metadata?.first_name, metadata?.last_name]
    .filter(Boolean)
    .join(" ");

  return user ? (
    <div className="flex items-center gap-4">
      <Link href="/profile" className="font-medium hover:underline">
        Hey, {displayName || "there"}!
      </Link>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
