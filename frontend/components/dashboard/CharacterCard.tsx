import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserRound } from "lucide-react";

type CharacterCardProps = {
  name: string;
  settingName: string;
  status: "Draft" | "Complete";
};

export function CharacterCard({
  name,
  settingName,
  status,
}: CharacterCardProps) {
  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4 text-primary" />

          <CardTitle>{name}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">
          {settingName}
        </p>

        <span
          className={[
            "inline-flex rounded-full px-2 py-1 text-xs font-medium",
            status === "Complete"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          ].join(" ")}
        >
          {status}
        </span>
      </CardContent>

      <CardFooter>
        <Button variant="outline" className="w-full">
          {status === "Draft" ? "Continue" : "View"}
        </Button>
      </CardFooter>
    </Card>
  );
}