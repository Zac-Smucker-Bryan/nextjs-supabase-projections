import { AppShell } from "@/components/app-shell";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { getActivityEvents } from "@/lib/actions/activity";

export default async function ActivityPage() {
  const events = await getActivityEvents();

  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Activity</h1>
        <p className="mt-2 text-muted-foreground">Track changes and saved versions across your projections.</p>
        <div className="mt-8">
          <ActivityFeed events={events} />
        </div>
      </div>
    </AppShell>
  );
}
