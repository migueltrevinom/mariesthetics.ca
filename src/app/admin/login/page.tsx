"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "manager_login" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSent(true);
      if (data.devCode) setDevCode(data.devCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          purpose: "manager_login",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md border border-white/10 bg-white/5 p-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
          Management access
        </h1>
        <p className="mt-2 text-sm text-white/50">
          OTP login for studio managers only. Not linked from the public site.
        </p>
        {error && <p className="mt-4 text-sm text-[#e8a0a2]">{error}</p>}
        {devCode && (
          <p className="mt-4 text-sm text-[#9dceb8]">Dev code: {devCode}</p>
        )}
        <div className="mt-8 space-y-3">
          <input
            type="email"
            placeholder="Manager email"
            className="w-full border border-white/15 bg-black/20 px-3 py-3 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {!sent ? (
            <button
              type="button"
              className="w-full bg-[#2f5d4a] px-4 py-3 text-sm text-white"
              disabled={loading || !email}
              onClick={() => void requestCode()}
            >
              Send OTP
            </button>
          ) : (
            <>
              <input
                placeholder="6-digit code"
                className="w-full border border-white/15 bg-black/20 px-3 py-3 text-white"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button
                type="button"
                className="w-full bg-[#2f5d4a] px-4 py-3 text-sm text-white"
                disabled={loading || !code}
                onClick={() => void verify()}
              >
                Verify
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
