"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useIsMobile } from "@/hooks/use-mobile";
import type { User } from "@/lib/dal";
import UserDropdownMenu from "./user-dropdown-menu";

type HeaderProps = {
  user: User | null;
};

const Header = ({ user }: HeaderProps) => {
  const isMobile = useIsMobile();

  if (isMobile) return;

  return (
    <div className="p-4 items-center gap-4 hidden md:flex">
      <InputGroup>
        <InputGroupInput placeholder="جستجو ..." />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        {/* <InputGroupAddon align="inline-end">
          <Button size="icon-xs" variant="ghost">
            <X />
          </Button>
        </InputGroupAddon> */}
      </InputGroup>
      {user ? (
        <UserDropdownMenu user={user} />
      ) : (
        <Link href={"/auth"}>
          <Button className="px-6">ورود | ثبت نام</Button>
        </Link>
      )}
    </div>
  );
};

export default Header;
