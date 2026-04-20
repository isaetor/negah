import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/dal";

const PrivateLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const user = await getUser();
  const h = await headers();
  const pathname = h.get("x-pathname");
  const isCompleteProfilePage = pathname === "/complete-profile";
  const isDashboardPage = pathname === "/dashboard";

  if (!user) {
    redirect(`/auth?callbackUrl=${pathname}`);
  }

  if (!user.username && !isCompleteProfilePage) {
    redirect(
      `/complete-profile?callbackUrl=${encodeURIComponent(pathname ?? "/")}`,
    );
  }

  if (user.username && isCompleteProfilePage) {
    redirect(`/${user.username}`);
  }

  if (isDashboardPage && user.role !== "ADMIN") {
    redirect(`/${user.username}`);
  }

  return <div>{children}</div>;
};

export default PrivateLayout;
