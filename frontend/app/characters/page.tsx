import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CharacterSearch } from "@/components/characters/CharacterSearch";
import { CharacterListCard } from "@/components/characters/CharacterListCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function CharactersPage() {
  return (
    <AppShell>
      <PageHeader
        title="Characters"
        description="Manage your saved character backgrounds."
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            Create Character
          </Button>
        }
      />

      <div className="space-y-6">
        <CharacterSearch />

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">All</Button>
          <Button variant="ghost">Drafts</Button>
          <Button variant="ghost">Complete</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CharacterListCard
            name="Theron Vale"
            settingName="Osepia"
            homeland="Sasymon"
            status="Draft"
          />

          <CharacterListCard
            name="Elara Venn"
            settingName="Campaign Setting 2"
            homeland="Northern Marches"
            status="Complete"
          />

          <CharacterListCard
            name="Unnamed Character"
            settingName="Osepia"
            status="Draft"
          />
        </div>
      </div>
    </AppShell>
  );
}