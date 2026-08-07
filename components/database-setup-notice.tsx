import { Database } from "lucide-react";

export function DatabaseSetupNotice() {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <Database className="mx-auto mb-3 size-8 text-muted-foreground" />
      <h2 className="font-medium">The app is connected, but its tables are not set up yet.</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
        Authentication is working. Next, run the first SQL migration in the
        Supabase SQL Editor to create your collections and projects tables.
      </p>
    </div>
  );
}
