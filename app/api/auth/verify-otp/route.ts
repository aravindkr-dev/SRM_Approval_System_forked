import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, otp } = await req.json();

  const stored = otpStore.get(email);
  if (!stored || stored !== otp) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
