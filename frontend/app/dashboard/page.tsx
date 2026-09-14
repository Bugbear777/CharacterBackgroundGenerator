import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Manage your settings and characters."
      />

      <div>
        Dashboard content goes here.
      </div>
    </AppShell>
  );
}