"use client";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

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
  const curentTheme = themes.find((item) => item.key === theme);

  const mounted = useMounted();

  if (!mounted) {
    return (
      <Skeleton className={cn("size-10 shrink-0 rounded-full", className)} />
    );
  }

  return (
    <Button
      onClick={() =>
        setTheme(
          theme === "system" ? "light" : theme === "light" ? "dark" : "system",
        )
      }
      className={className}
      variant={"simple"}
      size="icon-lg"
    >
      {curentTheme && <curentTheme.icon />}
    </Button>
  );
};
