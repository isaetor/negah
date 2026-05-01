"use client";

import {
  Bell,
  Home,
  PlusSquare,
  Search,
  Settings,
  UserIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import type { User } from "@/lib/dal";

export type SidebarProps = {
  user: User | null;
};
const Sidebar = ({ user }: SidebarProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="fixed md:relative bottom-0 left-0 right-0 h-14 rounded-t-3xl md:rounded-none md:h-screen md:min-w-18 border-t md:border-l p-4 flex md:flex-col md:gap-6 justify-around items-center z-50 bg-background">
      {!isMobile && (
        <Button
          variant={"simple"}
          size="icon-lg"
          className="hidden md:flex"
          asChild
        >
          <Link href={"/"}>
            <Image src="/logo.svg" alt="logo" width={30} height={30} priority />
          </Link>
        </Button>
      )}
      <Button variant={"simple"} size="icon-lg" asChild>
        <Link href={"/"}>
          <Home />
        </Link>
      </Button>
      <Button
        variant={"simple"}
        size="icon-lg"
        className="flex md:hidden"
        asChild
      >
        <Link href={"/seacrh"}>
          <Search />
        </Link>
      </Button>
      <Button variant={"simple"} size="icon-lg" asChild>
        <Link href={"/create"}>
          <PlusSquare />
        </Link>
      </Button>
      <Button variant={"simple"} size="icon-lg" asChild>
        <Link href={"/notifications"}>
          <Bell />
        </Link>
      </Button>
      {!isMobile && (
        <>
          <div className="h-full hidden md:flex"></div>
          <ThemeSwitcher className="hidden md:flex" />
          <Button
            variant={"simple"}
            className="hidden md:flex"
            size="icon-lg"
            asChild
          >
            <Link href={"/settings"}>
              <Settings />
            </Link>
          </Button>
        </>
      )}
      {isMobile && user ? (
        <Link
          href={user.username ? `/${user.username}` : "/complete-profile"}
          className="size-12 flex items-center justify-center"
        >
          <Avatar size="sm">
            <AvatarImage
              src={user.avatar || "/avatars/default.png"}
              alt={user.username || "user avatar"}
            />
          </Avatar>
        </Link>
      ) : (
        <Button
          variant={"simple"}
          size="icon-lg"
          className="flex md:hidden"
          asChild
        >
          <Link href={"/auth"}>
            <UserIcon />
          </Link>
        </Button>
      )}
    </div>
  );
};

export default Sidebar;
