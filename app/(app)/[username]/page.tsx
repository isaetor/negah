import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { verifySession } from "@/lib/dal";
import prisma from "@/lib/prisma";

const ProfilePage = async ({
  params,
}: {
  params: Promise<{ username: string }>;
}) => {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (!user) {
    notFound();
  }

  let isProfile: boolean = false;
  const session = await verifySession();
  if (session && session.phoneNumber === user.phoneNumber) {
    isProfile = true;
  }

  return (
    <div className="container mx-auto px-4">
      <h1>پروفایل {user.username}</h1>
      <p>شماره تماس: {user.phoneNumber}</p>
      {isProfile && <Button>خروج از حساب</Button>}
    </div>
  );
};

export default ProfilePage;
