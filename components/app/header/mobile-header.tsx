import {
  Bell,
  ChevronLeft,
  Home,
  Images,
  LayoutPanelLeft,
  Plus,
  Search,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { HeaderProps } from ".";

const MobileHeader = ({ user }: HeaderProps) => {
  return (
    <header className="fixed bottom-0 left-0 right-0 border-t bg-background z-50">
      <nav className="flex items-center justify-between px-8">
        <Link className="size-12 flex items-center justify-center" href={"/"}>
          <Home />
        </Link>
        <Link
          className="size-12 flex items-center justify-center"
          href={"/seacrh"}
        >
          <Search />
        </Link>
        <CreateButton />
        <Link
          className="size-12 flex items-center justify-center"
          href={"/notification"}
        >
          <Bell />
        </Link>
        {user ? (
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
          <Link
            className="size-12 flex items-center justify-center"
            href={`/auth`}
          >
            <User />
          </Link>
        )}
      </nav>
    </header>
  );
};

export default MobileHeader;

export const CreateButton = () => {
  const [open, setOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="size-12 flex items-center justify-center"
        >
          <Plus />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>چه چیزی می‌خواهید ایجاد کنید؟</DrawerTitle>
          <DrawerDescription>
            یک پست جدید بسازید یا یک تخته برای سازماندهی ایده‌ها ایجاد کنید.
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid grid-cols-2 px-4 gap-4 pb-4">
          <Button
            variant="secondary"
            className="h-20 w-full rounded-2xl"
            onClick={() => setOpen(false)}
            asChild
          >
            <Link href={"/create"}>
              <Images />
              ایجاد پست
              <ChevronLeft />
            </Link>
          </Button>
          <Button
            variant="secondary"
            className="h-20 w-full rounded-2xl"
            disabled
          >
            <LayoutPanelLeft />
            ایجاد تخته
            <ChevronLeft />
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
