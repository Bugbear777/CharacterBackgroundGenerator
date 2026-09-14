"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Menu,
  ScrollText,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import { useState } from "react";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: BookOpen,
  },
  {
    label: "Characters",
    href: "/characters",
    icon: Users,
  },
  {
    label: "Builder",
    href: "/builder",
    icon: WandSparkles,
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b px-4 md:hidden">
        <div className="flex items-center gap-2">
          <ScrollText className="h-6 w-6" />
          <span className="text-lg font-semibold">Lorebound</span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
          />

          <aside className="relative z-10 flex h-full w-72 flex-col border-r bg-background shadow-lg">
            <div className="flex h-16 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2">
                <ScrollText className="h-6 w-6" />
                <span className="text-lg font-semibold">Lorebound</span>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 p-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;

                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={[
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t p-4">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border">
                  JM
                </div>

                <div className="min-w-0">
                  <div className="truncate font-medium">
                    Joseph Marlow
                  </div>

                  <div className="truncate text-xs text-muted-foreground">
                    Profile
                  </div>
                </div>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}