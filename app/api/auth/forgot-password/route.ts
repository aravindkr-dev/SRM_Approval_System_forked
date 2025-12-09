import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const otpStore = new Map<string, string>(); // Temporary in-memory OTP storage

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, otp);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER!,
    to: email,
    subject: "SRM-RMP Password Reset OTP",
    text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
  });

  return NextResponse.json({ success: true });
}
