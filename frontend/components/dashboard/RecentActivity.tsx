import { Clock3 } from "lucide-react";

type RecentActivityProps = {
  items: string[];
};

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-primary" />

        <h2 className="text-xl font-semibold">
          Recent Activity
        </h2>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {items.map((item) => (
          <li
            key={item}
            className="px-4 py-3 text-sm text-muted-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}