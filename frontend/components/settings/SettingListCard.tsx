import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, MoreHorizontal } from "lucide-react";

type SettingListCardProps = {
  name: string;
  entryCount: number;
  updatedText: string;
};

export function SettingListCard({
  name,
  entryCount,
  updatedText,
}: SettingListCardProps) {
  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <CardTitle>{name}</CardTitle>
          </div>

          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Setting options</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>{entryCount} entries</p>
        <p>{updatedText}</p>
      </CardContent>

      <CardFooter>
        <Button className="w-full">
          Open Setting
        </Button>
      </CardFooter>
    </Card>
  );
}