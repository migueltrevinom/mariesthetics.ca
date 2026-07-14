"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);
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
        body: JSON.stringify({
          email,
          name: name || undefined,
          purpose: "client_login",
        }),
      });
      const data = await res.json();
      if (res.status === 400 && data.needsProfile) {
        setNeedsProfile(true);
        setError("New here — add your name to create an account.");
        return;
      }
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
          purpose: "client_login",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push("/portal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="aurora grain relative min-h-[90svh] overflow-hidden pt-40 pb-24 md:pt-48">
      <div className="relative mx-auto max-w-md px-6 md:px-10">
        <h1 className="display text-5xl text-ivory">
          Client login
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          Email one-time code — no password. Guests can book without an account.
        </p>
        {error && <p className="mt-4 text-sm text-blush">{error}</p>}
        {devCode && (
          <p className="mt-4 text-sm text-leaf">Dev code: {devCode}</p>
        )}
        <div className="mt-8 space-y-3">
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-[var(--line)] bg-white px-3 py-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {(needsProfile || !sent) && (
            <input
              placeholder="Full name (new accounts)"
              className="w-full border border-[var(--line)] bg-white px-3 py-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          {!sent ? (
            <button
              type="button"
              className="btn-primary w-full"
              disabled={loading || !email}
              onClick={() => void requestCode()}
            >
              Send code
            </button>
          ) : (
            <>
              <input
                placeholder="6-digit code"
                className="w-full border border-[var(--line)] bg-white px-3 py-3"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary w-full"
                disabled={loading || !code}
                onClick={() => void verify()}
              >
                Verify & continue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
