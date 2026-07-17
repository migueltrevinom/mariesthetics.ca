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
      const res = await fetch("/api/managers/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
      const res = await fetch("/api/managers/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
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
    <div className="admin-shell relative flex min-h-screen items-center justify-center px-6 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[400px] h-[400px] rounded-full bg-[#2f6b50] opacity-[0.06] blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 left-1/3 -z-10 w-[280px] h-[280px] rounded-full bg-[#c8a86b] opacity-[0.03] blur-[100px] pointer-events-none"></div>

      {/* Privy-style Premium Card */}
      <div className="w-full max-w-md border border-white/[0.08] bg-[#0c120e]/85 backdrop-blur-2xl px-8 py-10 sm:px-10 sm:py-12 rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.05)] text-center">
        {/* Brand / Logo */}
        <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-[#c8a86b] font-semibold mb-2">
          Mari Esthetics
        </h2>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-white tracking-wide">
          Management Access
        </h1>
        <p className="mt-2 text-xs text-white/50 leading-relaxed max-w-[280px] mx-auto">
          OTP login for studio managers only. Not linked from the public site.
        </p>

        {error && (
          <div className="mt-5 border border-[#e8a0a2]/20 bg-[#e8a0a2]/5 px-4 py-2.5 rounded-lg text-xs text-[#e8a0a2] text-left">
            {error}
          </div>
        )}

        {devCode && (
          <div className="mt-5 border border-[#9dceb8]/20 bg-[#9dceb8]/5 px-4 py-2.5 rounded-lg text-xs text-[#9dceb8] font-mono">
            Dev code: {devCode}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!sent) {
              if (!loading && email) {
                void requestCode();
              }
            } else {
              if (!loading && code.trim().length === 6) {
                void verify();
              }
            }
          }}
          className="mt-8 space-y-4"
        >
          <input
            type="email"
            placeholder="Manager email"
            className="w-full border border-white/10 bg-black/40 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-[#c8a86b] focus:ring-1 focus:ring-[#c8a86b]/40 transition-all duration-200 placeholder-white/30"
            value={email}
            disabled={sent || loading}
            onChange={(e) => setEmail(e.target.value)}
          />

          {!sent ? (
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#c8a86b] to-[#e2c78c] hover:from-[#e2c78c] hover:to-[#c8a86b] hover:shadow-[0_0_20px_rgba(200,168,107,0.3)] active:scale-[0.99] disabled:opacity-40 disabled:scale-100 disabled:hover:shadow-none text-[#24180a] font-semibold text-sm py-3 px-4 rounded-xl transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
              disabled={loading || !email}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          ) : (
            <>
              <input
                placeholder="6-digit code"
                className="w-full border border-white/10 bg-black/40 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-[#c8a86b] focus:ring-1 focus:ring-[#c8a86b]/40 transition-all duration-200 placeholder-white/30 text-center tracking-[0.1em]"
                value={code}
                maxLength={6}
                disabled={loading}
                onChange={(e) => setCode(e.target.value)}
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#c8a86b] to-[#e2c78c] hover:from-[#e2c78c] hover:to-[#c8a86b] hover:shadow-[0_0_20px_rgba(200,168,107,0.3)] active:scale-[0.99] disabled:opacity-40 disabled:scale-100 disabled:hover:shadow-none text-[#24180a] font-semibold text-sm py-3 px-4 rounded-xl transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
                disabled={loading || code.trim().length !== 6}
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
              <button
                type="button"
                className="text-xs text-white/40 hover:text-white/60 transition-colors duration-200 font-medium underline underline-offset-4 cursor-pointer mt-2"
                onClick={() => {
                  setSent(false);
                  setCode("");
                }}
              >
                Change email
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
