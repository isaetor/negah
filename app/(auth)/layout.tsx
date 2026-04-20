import { redirect } from "next/navigation";
import { getUser } from "@/lib/dal";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  if (user) {
    redirect("/");
  }
  return <div>{children}</div>;
}
