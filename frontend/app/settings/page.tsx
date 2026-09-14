import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingListCard } from "@/components/settings/SettingListCard";
import { SettingSearch } from "@/components/settings/SettingSearch";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Settings"
        description="Manage your campaign worlds and setting information."
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            Create Setting
          </Button>
        }
      />

      <div className="space-y-6">
        <SettingSearch />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SettingListCard
            name="Osepia"
            entryCount={24}
            updatedText="Updated 2 days ago"
          />

          <SettingListCard
            name="Campaign Setting 2"
            entryCount={12}
            updatedText="Updated 5 days ago"
          />
        </div>
      </div>
    </AppShell>
  );
}