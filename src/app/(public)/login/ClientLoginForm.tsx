"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ClientLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(600); // 10 minutes

  const codeInputRef = useRef<HTMLInputElement>(null);

  // Instant client-side redirect if already authenticated
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user?.role === "client") {
          router.replace("/portal");
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => {
        setCheckingAuth(false);
      });
  }, [router]);

  // 10-minute countdown when code is sent
  useEffect(() => {
    if (!sent) return;
    setSecondsRemaining(600);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sent]);

  // Resend cooldown timer (30 seconds)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Auto-focus code input when step 2 opens
  useEffect(() => {
    if (sent && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [sent]);

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  async function handleRequestCode(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          purpose: "client_login",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send code. Please try again.");
      }
      setSent(true);
      setResendCooldown(30);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanCode = code.trim();
    if (cleanCode.length !== 6 || loading) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode,
          purpose: "client_login",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid verification code.");
      }
      router.push("/portal");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to verify code.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSent(false);
    setCode("");
    setError("");
  }

  if (checkingAuth) {
    return (
      <div className="aurora grain relative min-h-[92svh] overflow-hidden flex items-center justify-center py-28 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-3 text-[var(--ink-soft)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent" />
          <p className="text-xs uppercase tracking-wider">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aurora grain relative min-h-[92svh] overflow-hidden flex items-center justify-center py-28 px-4 sm:px-6">
      <div className="relative w-full max-w-md mx-auto">
        {/* Luxury Atelier Frame */}
        <div className="relative rounded-3xl border border-[var(--line-strong)]/20 bg-[var(--background)]/90 backdrop-blur-2xl p-8 sm:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.25)]">
          {/* Brand Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <span className="text-[11px] font-medium tracking-[0.32em] uppercase text-[var(--gold)]">
              Mari Esthetics
            </span>
            <span className="mt-2 h-px w-10 bg-gradient-to-r from-transparent via-[var(--gold)]/60 to-transparent" />
          </div>

          {!sent ? (
            /* STEP 1: ONLY ASK FOR EMAIL */
            <>
              <div className="text-center">
                <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl text-[var(--ink)] font-normal tracking-tight">
                  Client Access
                </h1>
                <p className="mt-2.5 text-xs sm:text-sm text-[var(--ink-soft)] font-light leading-relaxed">
                  Enter your email to receive a secure 10-minute access code. Passwordless and private.
                </p>
              </div>

              {error && (
                <div className="mt-6 p-4 rounded-2xl bg-[var(--blush)]/10 border border-[var(--blush)]/20 text-[var(--blush)] text-xs leading-relaxed text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleRequestCode} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="client-email" className="block text-[11px] uppercase tracking-[0.16em] text-[var(--ink-soft)] font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    id="client-email"
                    type="email"
                    required
                    autoFocus
                    placeholder="yourname@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--line)] bg-[var(--foam)]/50 px-4 py-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]/30 transition-all font-light"
                  />
                  <p className="mt-2 text-[11px] text-[var(--ink-faint)] leading-normal">
                    Enter the email associated with your booking reservation.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="btn-primary w-full !py-3.5 tracking-[0.12em] uppercase text-xs font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? "Sending Code..." : "Send Verification Code"}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-[var(--line-soft)] text-center text-xs text-[var(--ink-soft)]">
                <p>
                  Haven’t visited us yet?{" "}
                  <Link href="/book" className="text-[var(--gold)] hover:underline font-medium ml-1">
                    Book an appointment →
                  </Link>
                </p>
              </div>
            </>
          ) : (
            /* STEP 2: VERIFICATION OTP CODE */
            <>
              <div className="text-center">
                <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl text-[var(--ink)] font-normal tracking-tight">
                  Verify Code
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-[var(--ink-soft)] font-light">
                  A 6-digit access code was sent to:
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="font-mono text-xs sm:text-sm text-[var(--ink)] font-medium">
                    {email}
                  </span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-[var(--gold)] hover:underline cursor-pointer ml-1"
                  >
                    Change
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-5 p-4 rounded-2xl bg-[var(--blush)]/10 border border-[var(--blush)]/20 text-[var(--blush)] text-xs text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerify} className="mt-8 space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="otp-input" className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-soft)] font-medium">
                      One-Time Code
                    </label>
                    <span className="text-xs text-[var(--gold)] font-mono">
                      Expires in {formatTime(secondsRemaining)}
                    </span>
                  </div>
                  <input
                    ref={codeInputRef}
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    placeholder="••••••"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full text-center text-3xl font-mono tracking-[0.4em] rounded-2xl border border-[var(--line)] bg-[var(--foam)]/50 py-3.5 text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]/30 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.trim().length !== 6 || secondsRemaining === 0}
                  className="btn-primary w-full !py-3.5 tracking-[0.12em] uppercase text-xs font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>
              </form>

              <div className="mt-6 flex flex-col items-center gap-3 text-xs text-[var(--ink-soft)]">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={() => void handleRequestCode()}
                  className="text-[var(--gold)] hover:underline font-medium cursor-pointer disabled:opacity-40 disabled:no-underline"
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Didn’t receive it? Resend code"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                >
                  ← Use a different email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
