"use client";
import { Monitor, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

const themes = [
  {
    key: "system",
    icon: Monitor,
    label: "System theme",
  },
  {
    key: "light",
    icon: Sun,
    label: "Light theme",
  },
  {
    key: "dark",
    icon: Moon,
    label: "Dark theme",
  },
];

export const ThemeSwitcher = ({ className }: { className?: string }) => {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <Skeleton className={cn("h-9 w-27 rounded-full", className)} />;
  }

  return (
    <div
      className={cn(
        "relative isolate flex items-center h-9 rounded-full bg-background border overflow-hidden",
        className,
      )}
    >
      {themes.map(({ key, icon: Icon, label }) => {
        const isActive = theme === key;
        return (
          <button
            aria-label={label}
            className="relative size-9 cursor-pointer rounded-full flex items-center justify-center"
            key={key}
            onClick={() => setTheme(key as "light" | "dark" | "system")}
            type="button"
          >
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-full bg-accent dark:bg-input/30"
                layoutId="activeTheme"
                transition={{ type: "spring", duration: 0.5 }}
              />
            )}
            <Icon
              size={16}
              className={cn(
                "relative z-10 m-auto",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
