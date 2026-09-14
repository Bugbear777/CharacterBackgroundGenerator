"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";

type BuilderOptionCardProps = {
  title: string;
  description?: string;
  selected?: boolean;
  onSelect?: () => void;
};

export function BuilderOptionCard({
  title,
  description,
  selected = false,
  onSelect,
}: BuilderOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left"
    >
      <Card
        className={[
          "h-full transition-colors",
          "hover:border-primary/40",
          selected
            ? "border-primary bg-primary/5"
            : "border-border",
        ].join(" ")}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-base">
              {title}
            </CardTitle>

            <div
              className={[
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border",
              ].join(" ")}
            >
              {selected && <Check className="h-3 w-3" />}
            </div>
          </div>
        </CardHeader>

        {description && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </CardContent>
        )}
      </Card>
    </button>
  );
}