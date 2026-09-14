import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen } from "lucide-react";

type SettingCardProps = {
  name: string;
  entryCount: number;
  updatedText: string;
};

export function SettingCard({
  name,
  entryCount,
  updatedText,
}: SettingCardProps) {
  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />

          <CardTitle>{name}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>{entryCount} entries</p>
        <p>{updatedText}</p>
      </CardContent>

      <CardFooter>
        <Button variant="outline" className="w-full">
          Open Setting
        </Button>
      </CardFooter>
    </Card>
  );
}