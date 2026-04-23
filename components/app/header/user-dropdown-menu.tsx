"use client";
import { BadgeCheckIcon, BellIcon, LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import LogoutDialog from "@/components/auth/logout-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/lib/dal";
import { Avatar, AvatarImage } from "../../ui/avatar";

type UserDropdownMenuProps = {
  user: User;
};

const UserDropdownMenu = ({ user }: UserDropdownMenuProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Avatar>
              <AvatarImage
                src={user.avatar || "/avatars/default.png"}
                alt={user.username || "user avatar"}
              />
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link
                href={user.username ? `/${user.username}` : "/complete-profile"}
              >
                <BadgeCheckIcon />
                حساب کاربری
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BellIcon />
              اعلان ها
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)} variant="destructive">
            <LogOut />
            خروج از حساب کاربری
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LogoutDialog open={open} setOpen={setOpen} />
    </>
  );
};

export default UserDropdownMenu;
