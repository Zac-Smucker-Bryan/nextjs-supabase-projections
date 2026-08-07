import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DeveloperToolsPage() {
  return <AppShell><div className="max-w-2xl"><h1 className="text-3xl font-semibold tracking-tight">Developer tools</h1><p className="mt-2 text-muted-foreground">Quick links and setup notes for this project.</p><Card className="mt-8"><CardHeader><CardTitle>Current setup</CardTitle><CardDescription>Use Supabase for authentication and data, and Vercel to deploy the Next.js app.</CardDescription></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p>Database tables are managed from Supabase’s SQL Editor.</p><p>Deployment environment variables are managed in the Vercel project settings.</p></CardContent></Card></div></AppShell>;
}
