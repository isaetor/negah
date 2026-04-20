"use server";

import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import prisma from "./prisma";

export const verifySession = async () => {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  if (!session || !session?.phoneNumber) {
    return null;
  }

  return { isAuth: true, phoneNumber: session.phoneNumber, role: session.role };
};

export const getUser = async () => {
  const session = await verifySession();

  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber: session.phoneNumber },
    });
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.log("Failed to fetch user. error: ", error);
    return null;
  }
};
