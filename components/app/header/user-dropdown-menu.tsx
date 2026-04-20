"use client";
import { BadgeCheckIcon, BellIcon, LogOut } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  user: {
    avatarUrl: string;
    username: string;
    firstName: string;
    lastName: string;
  };
};

import Link from "next/link";
import LogoutDialog from "@/components/auth/logout-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "../../ui/avatar";

const UserDropdownMenu = ({ user }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Avatar>
              <AvatarImage
                src={user.avatarUrl || "/avatars/default.png"}
                alt={user.username}
              />
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={user.username ? `/${user.username}` : "/complete-profile"}>
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
