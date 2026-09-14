import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { SettingCard } from "@/components/dashboard/SettingCard";
import { CharacterCard } from "@/components/dashboard/CharacterCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Manage your settings and characters."
        actions={<QuickActions />}
      />

      <div className="space-y-10">
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading text-xl font-semibold">
              My Settings
            </h2>

            <Button
              variant="ghost"
              className="self-start sm:self-auto"
            >
              View All Settings
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SettingCard
              name="Osepia"
              entryCount={24}
              updatedText="Updated 2 days ago"
            />

            <SettingCard
              name="Campaign Setting 2"
              entryCount={12}
              updatedText="Updated 5 days ago"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading text-xl font-semibold">
              My Characters
            </h2>

            <Button
              variant="ghost"
              className="self-start sm:self-auto"
            >
              View All Characters
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <CharacterCard
              name="Theron Vale"
              settingName="Osepia"
              status="Draft"
            />

            <CharacterCard
              name="Character Name"
              settingName="Campaign Setting 2"
              status="Complete"
            />
          </div>
        </section>

        <RecentActivity
          items={[
            "Edited Osepia setting",
            "Added faction: Merchant Guild",
            "Updated Theron Vale",
          ]}
        />
      </div>
    </AppShell>
  );
}