"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import DesktopHeader from "./desktop-header";
import MobileHeader from "./mobile-header";

export type HeaderProps = {
  user: {
    avatarUrl: string;
    username: string;
    firstName: string;
    lastName: string;
  };
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
