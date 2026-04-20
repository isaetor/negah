import {
  Bell,
  ChevronDown,
  Images,
  LayoutTemplate,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { HeaderProps } from ".";
import UserDropdownMenu from "./user-dropdown-menu";

const DesktopHeader = ({ user }: HeaderProps) => {
  return (
    <header className="container mx-auto p-4 hidden md:block">
      <div className="flex items-center justify-between gap-12">
        <div className="flex items-center gap-4 min-w-fit">
          <Image src="/logo.svg" alt="logo" width={36} height={36} priority />
          <div className="flex items-center gap-2">
            <Button asChild variant={"ghost"}>
              <Link href="/">خانه</Link>
            </Button>
            <DropdownMenu>
              <Button variant={"ghost"} asChild>
                <DropdownMenuTrigger>
                  افزودن
                  <ChevronDown />
                </DropdownMenuTrigger>
              </Button>
              <DropdownMenuContent align="start">
                <Link href={"/create"}>
                  <DropdownMenuItem>
                    <Images />
                    افزودن رسانه
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem disabled>
                  <LayoutTemplate />
                  افزودن تخته
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <InputGroup className="bg-accent">
          <InputGroupInput placeholder="جستجو ..." />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <Button size="icon-xs" variant="ghost">
              <X />
            </Button>
          </InputGroupAddon>
        </InputGroup>

        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <Button variant={"outline"} size={"icon"}>
            <Bell />
          </Button>
          {user ? (
            <UserDropdownMenu user={user} />
          ) : (
            <Link href={"/auth"}>
              <Button className="px-6">ورود | ثبت نام</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;
