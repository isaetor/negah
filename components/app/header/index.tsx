"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import type { User } from "@/lib/dal";
import DesktopHeader from "./desktop-header";
import MobileHeader from "./mobile-header";

export type HeaderProps = {
  user: User | null;
};
const Header = ({ user }: HeaderProps) => {
  const isMobile = useIsMobile();

  return isMobile ? (
    <MobileHeader user={user} />
  ) : (
    <DesktopHeader user={user} />
  );
};

export default Header;
