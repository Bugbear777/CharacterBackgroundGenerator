"use client";

type SettingTabsProps = {
  activeTab?: string;
};

const tabs = [
  "Overview",
  "Locations",
  "Cultures",
  "Religions",
  "Factions",
  "Organizations",
  "Professions",
  "Social Classes",
  "Historical Events",
  "People",
];

export function SettingTabs({
  activeTab = "Overview",
}: SettingTabsProps) {
  return (
    <div className="overflow-x-auto border-b border-border">
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <button
              key={tab}
              type="button"
              className={[
                "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}