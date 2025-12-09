'use client';

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [cpassword, setCpassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== cpassword) {
      setError("Passwords do not match");
      return;
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      router.push("/login?message=Password reset successful");
    } else {
      setError(data.error || "Failed to reset password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">

        <h2 className="text-3xl font-bold text-center text-gray-900">
          Reset Password
        </h2>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        <form className="mt-6 space-y-4" onSubmit={handleReset}>
          <input
            type="password"
            required
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />

          <input
            type="password"
            required
            placeholder="Confirm new password"
            value={cpassword}
            onChange={(e) => setCpassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />

          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-medium"
          >
            Reset Password
          </button>
        </form>

      </div>
    </div>
  );
}
