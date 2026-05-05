"use server";

import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import prisma from "./prisma";

export const verifySession = async () => {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  if (!session || !session?.userId || !session?.phoneNumber) {
    return null;
  }

  return {
    userId: session.userId,
    phoneNumber: session.phoneNumber,
    role: session.role,
  };
};

export type User = {
  id: string;
  phoneNumber: string;
  username: string | null;
  avatar: string | null;
  firstName: string | null;
  lastName: string | null;
  role: "USER" | "ADMIN";
};

export const getUser = async () => {
  const session = await verifySession();

  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber: session.phoneNumber },
      select: {
        id: true,
        phoneNumber: true,
        username: true,
        avatar: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
    return user as User | null;
  } catch (error) {
    console.log("Failed to fetch user. error: ", error);
    return null;
  }
};
