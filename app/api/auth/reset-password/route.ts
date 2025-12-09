import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";  // adjust if needed
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { email },
    data: { password: hashed },
  });

  otpStore.delete(email);

  return NextResponse.json({ success: true });
}
