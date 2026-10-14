"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

export interface GiftCardData {
  code: string;
  initialBalanceCents: number;
  remainingBalanceCents: number;
  amountCad: number;
  initialAmountCad: number;
  recipientName: string;
  senderName: string;
  message: string;
  expiryDate?: string | null;
  isExpired?: boolean;
  createdAt?: string;
}

interface GiftCardUnwrapExperienceProps {
  giftCard: GiftCardData;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  angle: number;
  angularVelocity: number;
  isTriangle: boolean;
  life?: number;
  maxLife?: number;
}

export function GiftCardUnwrapExperience({ giftCard }: GiftCardUnwrapExperienceProps) {
  const [isUnwrapped, setIsUnwrapped] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [copied, setCopied] = useState(false);

  // 3D Tilt physics for Talisman & Card
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const burstParticlesRef = useRef<Particle[]>([]);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Colors based on Dala / Constellation Token System
  const CHROMATIC_PALETTE = [
    "#8052ff", // Electric Iris
    "#ffb829", // Saffron Spark
    "#15846e", // Deep Verdant
    "#a855f7", // Violet 500
    "#ffffff", // Bone White
    "#38bdf8", // Sky Spark
  ];

  // Initialize and run high-performance Constellation Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Populate ambient constellation particles
    const particleCount = width < 768 ? 65 : 120;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const color = CHROMATIC_PALETTE[Math.floor(Math.random() * CHROMATIC_PALETTE.length)];
      const baseAlpha = 0.2 + Math.random() * 0.65;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: 1.5 + Math.random() * 2.5,
        color,
        alpha: baseAlpha,
        baseAlpha,
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.02,
        isTriangle: Math.random() > 0.35,
      });
    }
    particlesRef.current = particles;

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      const mouse = mousePosRef.current;

      // 1. Draw ambient particles and subtle constellation lines
      const pts = particlesRef.current;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];

        // Cursor deflection
        if (mouse) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const force = (130 - dist) / 130;
            p.x -= (dx / dist) * force * 1.5;
            p.y -= (dy / dist) * force * 1.5;
          }
        }

        // Float movement
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.angularVelocity;

        // Oscillate brightness
        p.alpha = p.baseAlpha + Math.sin(time + i) * 0.15;

        // Wrap boundaries
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = Math.max(0.1, Math.min(1, p.alpha));
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        if (p.isTriangle) {
          // Sharp chromatic triangular glyph
          const s = p.size * 1.8;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.866, s * 0.5);
          ctx.lineTo(-s * 0.866, s * 0.5);
          ctx.closePath();
          if (i % 2 === 0) {
            ctx.fill();
          } else {
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        } else {
          // Soft circular star point
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Delicate constellation links between proximate particles
        for (let j = i + 1; j < pts.length; j++) {
          const p2 = pts[j];
          const distSq = (p.x - p2.x) ** 2 + (p.y - p2.y) ** 2;
          if (distSq < 60 * 60) {
            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 60) * 0.08;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 2. Render Supernova / Warp Burst particles
      const burstPts = burstParticlesRef.current;
      for (let i = burstPts.length - 1; i >= 0; i--) {
        const bp = burstPts[i];
        bp.x += bp.vx;
        bp.y += bp.vy;
        bp.vx *= 0.96;
        bp.vy *= 0.96;
        bp.angle += bp.angularVelocity;
        if (bp.life !== undefined) {
          bp.life -= 1;
          bp.alpha = (bp.life / (bp.maxLife || 60)) * bp.baseAlpha;
          if (bp.life <= 0) {
            burstPts.splice(i, 1);
            continue;
          }
        }

        ctx.save();
        ctx.translate(bp.x, bp.y);
        ctx.rotate(bp.angle);
        ctx.globalAlpha = Math.max(0, bp.alpha);
        ctx.fillStyle = bp.color;
        ctx.strokeStyle = bp.color;

        const s = bp.size * 2;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.866, s * 0.5);
        ctx.lineTo(-s * 0.866, s * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // Supernova burst triggered on unwrap
  const triggerSupernovaBurst = useCallback((originX: number, originY: number) => {
    const burstCount = 80;
    const newBurst: Particle[] = [];
    for (let i = 0; i < burstCount; i++) {
      const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.4;
      const speed = 3.5 + Math.random() * 8.5;
      const color = CHROMATIC_PALETTE[Math.floor(Math.random() * CHROMATIC_PALETTE.length)];
      newBurst.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1,
        baseAlpha: 1,
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.15,
        isTriangle: true,
        life: 55 + Math.floor(Math.random() * 30),
        maxLife: 85,
      });
    }
    burstParticlesRef.current = newBurst;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY };
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const maxTilt = 10;
    setTilt({
      x: -(y / (rect.height / 2)) * maxTilt,
      y: (x / (rect.width / 2)) * maxTilt,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    mousePosRef.current = null;
    setTilt({ x: 0, y: 0 });
  }, []);

  const handleUnwrap = (e: React.MouseEvent) => {
    if (isOpening || isUnwrapped) return;
    setIsOpening(true);

    const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const originX = targetRect.left + targetRect.width / 2;
    const originY = targetRect.top + targetRect.height / 2;

    triggerSupernovaBurst(originX, originY);

    setTimeout(() => {
      setIsUnwrapped(true);
      setIsOpening(false);
    }, 650);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(giftCard.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-16 sm:py-24 bg-[#000000] text-white overflow-hidden select-none"
    >
      {/* ── THE SIGNATURE HERO CONSTELLATION VISUALIZATION ── */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-0 opacity-80 print:hidden"
      />

      {/* Atmospheric Void Ambient Gradient */}
      <div className="pointer-events-none fixed inset-0 bg-radial from-transparent via-[#000000]/60 to-[#000000] z-0 print:hidden" />

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center">

        {/* ── STAGE 1: SEALED MONOLITHIC TALISMAN (BEFORE UNWRAP) ── */}
        {!isUnwrapped && (
          <div
            className={`w-full flex flex-col items-center transition-all duration-700 ${
              isOpening ? "scale-110 opacity-0 blur-sm" : "opacity-100 scale-100"
            }`}
          >
            {/* Header Callout */}
            <div className="mb-10 space-y-3">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#ffb829] px-4 py-1.5 rounded-full border border-[#ffb829]/30 bg-[#ffb829]/10 shadow-[0_0_20px_rgba(255,184,41,0.15)]">
                <span>✦</span>
                <span>Exclusive Digital Certificate</span>
                <span>✦</span>
              </span>
              <h1 className="font-sans text-4xl sm:text-6xl text-white font-normal tracking-[-0.04em] leading-[1.05]">
                A Gift of Esthetic Care
              </h1>
              <p className="text-sm sm:text-base text-[#9a9a9a] font-extralight tracking-wide max-w-md mx-auto">
                Curated by <span className="text-white font-normal">{giftCard.senderName}</span>
                {giftCard.recipientName ? (
                  <> for <span className="text-white font-normal">{giftCard.recipientName}</span></>
                ) : ""}
              </p>
            </div>

            {/* 3D Floating Monolithic Talisman / Seal */}
            <div
              ref={containerRef}
              onClick={handleUnwrap}
              style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: "transform 0.15s ease-out",
              }}
              className="relative w-64 h-64 sm:w-76 sm:h-76 my-4 cursor-pointer group flex items-center justify-center [transform-style:preserve-3d]"
            >
              {/* Pulsing Chromatic Halo */}
              <div className="absolute inset-0 rounded-full bg-radial from-[#8052ff]/30 via-[#15846e]/15 to-transparent blur-3xl group-hover:from-[#8052ff]/50 transition-all duration-500 animate-pulse" />

              {/* Orbiting Constellation Ring (SVG) */}
              <div className="absolute inset-0 flex items-center justify-center animate-[spin_28s_linear_infinite] pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 300 300">
                  <circle
                    cx="150"
                    cy="150"
                    r="140"
                    fill="none"
                    stroke="#8052ff"
                    strokeWidth="1"
                    strokeDasharray="6 14"
                    opacity="0.35"
                  />
                  <circle
                    cx="150"
                    cy="150"
                    r="120"
                    fill="none"
                    stroke="#ffb829"
                    strokeWidth="1"
                    strokeDasharray="4 18"
                    opacity="0.25"
                  />
                </svg>
              </div>

              {/* Core Obsidian Void Disc */}
              <div className="relative z-10 w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-[#050505] border border-white/20 group-hover:border-[#8052ff] shadow-[0_0_40px_rgba(0,0,0,0.9),0_0_30px_rgba(128,82,255,0.25)] flex flex-col items-center justify-center transition-all duration-500 group-hover:scale-105">
                {/* Internal Specular Ring */}
                <div className="absolute inset-2 rounded-full border border-white/5 pointer-events-none" />

                {/* Stylized Geometric Constellation Monogram */}
                <svg className="w-16 h-16 sm:w-20 sm:h-20 mb-2 transition-transform duration-500 group-hover:rotate-12" viewBox="0 0 100 100">
                  {/* Outer Triangle */}
                  <polygon
                    points="50,15 88,80 12,80"
                    fill="none"
                    stroke="#8052ff"
                    strokeWidth="2.5"
                  />
                  {/* Inner Triangle Accent */}
                  <polygon
                    points="50,28 78,75 22,75"
                    fill="rgba(128,82,255,0.12)"
                    stroke="#ffb829"
                    strokeWidth="1.5"
                  />
                  {/* Central M Glyphic Monogram */}
                  <text
                    x="50"
                    y="63"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="22"
                    fontWeight="300"
                    letterSpacing="1.5"
                    fontFamily="sans-serif"
                  >
                    M
                  </text>
                </svg>

                <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-white/90">
                  Mari Esthetics
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] font-light text-[#ffb829] mt-0.5">
                  Tap to Unseal
                </span>
              </div>
            </div>

            {/* Dala Signature Violet Pill Action Button */}
            <div className="mt-8">
              <button
                type="button"
                onClick={handleUnwrap}
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#8052ff] hover:bg-[#6c3ef0] text-white text-xs font-semibold uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(128,82,255,0.4)] hover:shadow-[0_0_50px_rgba(128,82,255,0.7)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Awaken Certificate</span>
                <span className="text-sm transition-transform duration-300 group-hover:translate-x-1">→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 2: UNSEALED MONOLITHIC CERTIFICATE (CUSTOMER VIEW) ── */}
        {isUnwrapped && (
          <div className="w-full flex flex-col items-center animate-in zoom-in-95 fade-in duration-700">
            {/* Top Eyebrow Status */}
            <div className="mb-6 flex items-center justify-center gap-2 print:hidden">
              <span className="w-2 h-2 rounded-full bg-[#15846e] animate-ping" />
              <span className="text-[11px] font-semibold tracking-[0.28em] uppercase text-[#ffb829]">
                Certificate Unsealed · Ready to Redeem
              </span>
            </div>

            {/* 3D TILT MONOLITHIC CERTIFICATE CARD */}
            <div
              ref={containerRef}
              style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: "transform 0.15s ease-out",
              }}
              className="relative w-full max-w-lg rounded-3xl p-8 sm:p-11 bg-[#060606]/90 backdrop-blur-2xl border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_50px_rgba(128,82,255,0.15)] text-left overflow-hidden [transform-style:preserve-3d] print:border-2 print:border-black print:shadow-none print:bg-white print:text-black print:p-8"
            >
              {/* Specular Diagonal Light Wash */}
              <div className="pointer-events-none absolute -inset-full bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent rotate-45 transform translate-x-12 translate-y-12 print:hidden" />

              {/* Header: Studio Branding & Status */}
              <div className="flex items-start justify-between border-b border-white/10 pb-6 mb-7 print:border-black/20">
                <div>
                  <h3 className="text-xl sm:text-2xl font-normal text-white tracking-[0.2em] uppercase font-sans print:text-black">
                    Mari Esthetics
                  </h3>
                  <p className="text-[10px] tracking-[0.25em] text-[#9a9a9a] uppercase font-light mt-1 print:text-black/70">
                    Private Esthetics Studio · Edmonton
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase bg-[#15846e]/20 text-emerald-400 border border-[#15846e]/40 print:border-black print:text-black print:bg-transparent">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 print:hidden" />
                    {giftCard.isExpired ? "EXPIRED" : "ACTIVE VOUCHER"}
                  </span>
                </div>
              </div>

              {/* Main Scaled Value Display */}
              <div className="my-6">
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#ffb829] block mb-2 print:text-black/70">
                  Gift Certificate Value
                </span>
                <div className="flex items-baseline gap-3">
                  <p className="text-6xl sm:text-7xl font-normal text-white tracking-[-0.04em] leading-none print:text-black">
                    ${giftCard.amountCad.toFixed(2)}
                  </p>
                  <span className="text-xl sm:text-2xl font-light text-[#9a9a9a] tracking-widest font-sans print:text-black">
                    CAD
                  </span>
                </div>
                {giftCard.remainingBalanceCents !== giftCard.initialBalanceCents && (
                  <p className="text-[11px] font-mono text-emerald-400 mt-2 print:text-black">
                    Remaining Balance: ${(giftCard.remainingBalanceCents / 100).toFixed(2)} CAD (Original: ${(giftCard.initialAmountCad).toFixed(2)})
                  </p>
                )}
              </div>

              {/* Personalized Dedicated Message */}
              {giftCard.message && (
                <div className="my-6 p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-left print:bg-stone-50 print:border-black/15">
                  <span className="text-[10px] uppercase font-semibold tracking-[0.25em] text-[#9a9a9a] block mb-2 print:text-black/70">
                    Personal Note
                  </span>
                  <p className="text-sm sm:text-base text-white/90 font-extralight italic leading-relaxed print:text-black">
                    “{giftCard.message}”
                  </p>
                </div>
              )}

              {/* Recipient & Sender Row */}
              <div className="grid grid-cols-2 gap-6 py-5 border-t border-white/10 text-xs print:border-black/15">
                <div>
                  <span className="block text-[10px] uppercase font-semibold tracking-[0.25em] text-[#9a9a9a] print:text-black/70">
                    Recipient
                  </span>
                  <p className="font-normal text-white text-base mt-1 print:text-black">
                    {giftCard.recipientName || "Valued Client"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase font-semibold tracking-[0.25em] text-[#9a9a9a] print:text-black/70">
                    From
                  </span>
                  <p className="font-normal text-white text-base mt-1 print:text-black">
                    {giftCard.senderName || "Mari Esthetics"}
                  </p>
                </div>
              </div>

              {/* Voucher Code Box */}
              <div className="mt-5 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.03] p-4 sm:p-5 rounded-2xl border border-white/10 print:border-black/20 print:bg-stone-100">
                <div className="text-center sm:text-left">
                  <span className="block text-[9px] uppercase font-semibold tracking-[0.25em] text-[#9a9a9a] print:text-black">
                    Redemption / Coupon Code
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-medium tracking-[0.2em] text-white print:text-black select-all">
                    {giftCard.code}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-5 py-2.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white tracking-wider uppercase cursor-pointer transition-all duration-200 active:scale-95 print:hidden"
                >
                  <span>{copied ? "✓ Copied" : "Copy Code"}</span>
                </button>
              </div>
            </div>

            {/* ── ACTION BUTTONS (BELOW CARD) ── */}
            <div className="mt-8 w-full max-w-lg space-y-4 print:hidden">
              {/* Primary Redeem CTA: Signature Dala Electric Iris Violet Pill */}
              <Link
                href={`/book?coupon=${giftCard.code}`}
                className="w-full py-4 px-8 rounded-full bg-[#8052ff] hover:bg-[#6c3ef0] text-white text-center text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] shadow-[0_0_35px_rgba(128,82,255,0.45)] hover:shadow-[0_0_55px_rgba(128,82,255,0.7)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>Book Appointment with this Gift Card</span>
                <span className="text-base">→</span>
              </Link>

              {/* Secondary Ghost Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-3 px-5 rounded-full border border-white/20 bg-transparent hover:bg-white/5 text-xs font-semibold uppercase tracking-[0.15em] text-[#9a9a9a] hover:text-white cursor-pointer transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>Print Certificate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsUnwrapped(false)}
                  className="py-3 px-5 rounded-full border border-white/20 bg-transparent hover:bg-white/5 text-xs font-semibold uppercase tracking-[0.15em] text-[#9a9a9a] hover:text-white cursor-pointer transition-all duration-200"
                  title="Reseal Certificate"
                >
                  ↺ Reseal
                </button>
              </div>

              <p className="text-[11px] text-[#9a9a9a] font-extralight text-center pt-2">
                Credit automatically applies during online booking checkout or can be presented in-studio.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
