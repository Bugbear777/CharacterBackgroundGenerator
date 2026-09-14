import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function QuickActions() {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button>
        <Plus className="h-4 w-4" />
        Create Setting
      </Button>

      <Button variant="outline">
        <Plus className="h-4 w-4" />
        Create Character
      </Button>
    </div>
  );
}