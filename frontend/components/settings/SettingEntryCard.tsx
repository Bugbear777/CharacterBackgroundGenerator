import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SettingEntryCardProps = {
  name: string;
  type: string;
  description: string;
  relationshipCount: number;
};

export function SettingEntryCard({
  name,
  type,
  description,
  relationshipCount,
}: SettingEntryCardProps) {
  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardHeader className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <CardTitle>{name}</CardTitle>

          <span className="self-start rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            {type}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {description}
        </p>

        <p className="text-xs text-muted-foreground">
          {relationshipCount} relationships
        </p>
      </CardContent>

      <CardFooter>
        <Button variant="outline" className="w-full">
          Edit Entry
        </Button>
      </CardFooter>
    </Card>
  );
}