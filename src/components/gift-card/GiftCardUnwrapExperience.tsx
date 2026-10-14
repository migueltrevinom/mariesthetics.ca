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

  // 3D Tilt physics for Cube and Card
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const burstParticlesRef = useRef<Particle[]>([]);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Dala Constellation Chromatic Palette
  const CHROMATIC_PALETTE = [
    "#8052ff", // Electric Iris
    "#ffb829", // Saffron Spark
    "#15846e", // Deep Verdant
    "#c8a86b", // Studio Metallic Gold
    "#ffffff", // Bone White
    "#a855f7", // Violet Accent
  ];

  // High-performance background constellation canvas
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
    const particleCount = width < 768 ? 60 : 110;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const color = CHROMATIC_PALETTE[Math.floor(Math.random() * CHROMATIC_PALETTE.length)];
      const baseAlpha = 0.2 + Math.random() * 0.6;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: 1.5 + Math.random() * 2.5,
        color,
        alpha: baseAlpha,
        baseAlpha,
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.02,
        isTriangle: Math.random() > 0.4,
      });
    }
    particlesRef.current = particles;

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      const mouse = mousePosRef.current;

      // 1. Render ambient floating particles & constellation links
      const pts = particlesRef.current;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];

        if (mouse) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const force = (120 - dist) / 120;
            p.x -= (dx / dist) * force * 1.5;
            p.y -= (dy / dist) * force * 1.5;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.angularVelocity;
        p.alpha = p.baseAlpha + Math.sin(time + i) * 0.15;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = Math.max(0.1, Math.min(1, p.alpha));
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        if (p.isTriangle) {
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
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        for (let j = i + 1; j < pts.length; j++) {
          const p2 = pts[j];
          const distSq = (p.x - p2.x) ** 2 + (p.y - p2.y) ** 2;
          if (distSq < 55 * 55) {
            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 55) * 0.08;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 2. Render Supernova sparks when unboxing
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

  // Supernova fountain particles burst when lid opens
  const triggerSupernovaBurst = useCallback((originX: number, originY: number) => {
    const burstCount = 85;
    const newBurst: Particle[] = [];
    for (let i = 0; i < burstCount; i++) {
      const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.4;
      const speed = 4 + Math.random() * 9;
      const color = CHROMATIC_PALETTE[Math.floor(Math.random() * CHROMATIC_PALETTE.length)];
      newBurst.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5, // upward fountain bias
        size: 2 + Math.random() * 3,
        color,
        alpha: 1,
        baseAlpha: 1,
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.15,
        isTriangle: true,
        life: 60 + Math.floor(Math.random() * 35),
        maxLife: 95,
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
    const maxTilt = 12;
    setTilt({
      x: -(y / (rect.height / 2)) * maxTilt,
      y: (x / (rect.width / 2)) * maxTilt,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    mousePosRef.current = null;
    setTilt({ x: 0, y: 0 });
  }, []);

  const handleUnwrap = (e?: React.MouseEvent) => {
    if (isOpening || isUnwrapped) return;
    setIsOpening(true);

    let originX = window.innerWidth / 2;
    let originY = window.innerHeight / 2;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    }

    triggerSupernovaBurst(originX, originY);

    setTimeout(() => {
      setIsUnwrapped(true);
      setIsOpening(false);
    }, 850);
  };

  const handleWrapAgain = () => {
    setIsUnwrapped(false);
    setIsOpening(false);
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
      className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-14 sm:py-20 bg-[#000000] text-white overflow-hidden select-none"
    >
      {/* ── HIGH PERFORMANCE CONSTELLATION CANVAS ── */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-0 opacity-80 print:hidden"
      />

      {/* Atmospheric Void Gradient */}
      <div className="pointer-events-none fixed inset-0 bg-radial from-transparent via-[#000000]/65 to-[#000000] z-0 print:hidden" />

      {/* Main Content Stage */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center">

        {/* ── STAGE 1: THE REAL 3D LUXURY PRESENT CUBE (BEFORE UNBOXING) ── */}
        {!isUnwrapped && (
          <div className="w-full flex flex-col items-center">
            {/* Header Eyebrow & Title */}
            <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-700">
              <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] uppercase text-[#ffb829] px-4 py-1.5 rounded-full border border-[#ffb829]/30 bg-[#ffb829]/10 shadow-[0_0_25px_rgba(255,184,41,0.18)]">
                <span>✦</span>
                <span>Exclusive Delivery</span>
                <span>✦</span>
              </span>
              <h1 className="font-sans text-3xl sm:text-5xl text-white font-normal tracking-[-0.04em] leading-[1.1]">
                You’ve Received a Gift
              </h1>
              <p className="text-xs sm:text-sm text-[#9a9a9a] font-extralight tracking-wide max-w-md mx-auto">
                Curated by <span className="text-white font-normal">{giftCard.senderName}</span>
                {giftCard.recipientName ? (
                  <> for <span className="text-white font-normal">{giftCard.recipientName}</span></>
                ) : ""}
              </p>
            </div>

            {/* ── TRUE CSS 3D ISOMETRIC PRESENT CUBE STAGE ── */}
            <div
              ref={containerRef}
              onClick={() => handleUnwrap()}
              className="relative my-8 py-6 w-full flex items-center justify-center [perspective:1200px] cursor-pointer group"
            >
              {/* Floor Shadow Plane Under the Cube */}
              <div
                style={{
                  transform: "rotateX(75deg) translateZ(-115px)",
                }}
                className="absolute w-72 h-56 rounded-full bg-black/90 blur-2xl pointer-events-none transition-transform duration-300 group-hover:scale-105"
              />

              {/* Ambient Radiant Glow around the Cube */}
              <div className="absolute w-72 h-72 rounded-full bg-radial from-[#c8a86b]/20 via-[#8052ff]/15 to-transparent blur-3xl pointer-events-none group-hover:from-[#c8a86b]/35 transition-all duration-500 animate-pulse" />

              {/* ── THE 3D CUBE ASSEMBLY (ROTATED IN 3D SPACE) ── */}
              <div
                style={{
                  transform: `rotateX(${16 + tilt.x}deg) rotateY(${-26 + tilt.y}deg)`,
                  transformStyle: "preserve-3d",
                  transition: "transform 0.15s ease-out",
                }}
                className="relative w-[210px] sm:w-[230px] h-[180px] sm:h-[190px]"
              >
                {/* ── 1. THE 3D DETACHABLE LID (LIFTS IN 3D SPACE) ── */}
                <div
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isOpening
                      ? "translateY(-240px) rotateX(-50deg) rotateZ(12deg) scale(0.92)"
                      : "translateY(0px)",
                    opacity: isOpening ? 0 : 1,
                    transition: isOpening
                      ? "transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.75s ease"
                      : "transform 0.4s ease",
                  }}
                  className={`absolute -top-3.5 -left-2.5 w-[230px] sm:w-[250px] h-[44px] z-30 ${
                    !isOpening ? "group-hover:-translate-y-2.5" : ""
                  }`}
                >
                  {/* LID TOP FACE (The horizontal surface where ribbons cross & seal rests) */}
                  <div
                    style={{
                      transform: "rotateX(90deg) translateZ(22px)",
                      transformStyle: "preserve-3d",
                    }}
                    className="absolute inset-0 w-[230px] sm:w-[250px] h-[230px] sm:h-[250px] rounded-xl bg-gradient-to-br from-[#1d3326] via-[#13231b] to-[#0c1611] border-2 border-[#c8a86b]/70 shadow-2xl flex items-center justify-center overflow-hidden"
                  >
                    {/* Top Face Vertical Ribbon */}
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 sm:w-9 bg-gradient-to-r from-[#9b7835] via-[#fae7b9] to-[#9b7835] shadow-md" />
                    {/* Top Face Horizontal Ribbon */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 sm:h-9 bg-gradient-to-b from-[#9b7835] via-[#fae7b9] to-[#9b7835] shadow-md" />

                    {/* Golden Specular Sheen */}
                    <div className="pointer-events-none absolute -inset-full bg-gradient-to-tr from-transparent via-white/15 to-transparent rotate-45 transform translate-x-4" />

                    {/* Bespoke Luxury Rosette Seal at Intersection */}
                    <div className="relative z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#fae7b9] via-[#c8a86b] to-[#7f6024] p-0.5 shadow-2xl flex items-center justify-center border border-[#fff2d6]/60 transition-transform duration-500 group-hover:rotate-12">
                      <div className="w-full h-full rounded-full bg-[#08100c] flex items-center justify-center border border-[#c8a86b]/50 shadow-inner">
                        <svg viewBox="0 0 40 40" className="w-7 h-7 text-[#fae7b9]">
                          <polygon
                            points="20,3 24,14 36,15 27,23 30,35 20,28 10,35 13,23 4,15 16,14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <text
                            x="20"
                            y="24"
                            textAnchor="middle"
                            fill="#fae7b9"
                            fontSize="10"
                            fontWeight="600"
                            fontFamily="sans-serif"
                          >
                            M
                          </text>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* LID FRONT SKIRT (Faces directly forward) */}
                  <div
                    style={{
                      transform: "translateZ(115px) sm:translateZ(125px)",
                    }}
                    className="absolute inset-0 w-[230px] sm:w-[250px] h-[44px] bg-gradient-to-b from-[#1c2e24] to-[#0c1611] border-x border-b-2 border-[#c8a86b]/60 shadow-md flex items-center justify-center overflow-hidden"
                  >
                    {/* Front Skirt Ribbon aligning with body ribbon */}
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 sm:w-9 bg-gradient-to-r from-[#9b7835] via-[#fae7b9] to-[#9b7835]" />
                  </div>

                  {/* LID RIGHT SKIRT (Faces to the right side) */}
                  <div
                    style={{
                      transform: "rotateY(90deg) translateZ(115px) sm:translateZ(125px)",
                    }}
                    className="absolute inset-0 w-[230px] sm:w-[250px] h-[44px] bg-gradient-to-b from-[#14231b] to-[#08100c] border-x border-b-2 border-[#c8a86b]/40 flex items-center justify-center overflow-hidden"
                  >
                    {/* Right Skirt Ribbon */}
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 sm:w-9 bg-gradient-to-r from-[#7f6024] via-[#d6bc85] to-[#7f6024]" />
                  </div>

                  {/* LID LEFT SKIRT */}
                  <div
                    style={{
                      transform: "rotateY(-90deg) translateZ(115px) sm:translateZ(125px)",
                    }}
                    className="absolute inset-0 w-[230px] sm:w-[250px] h-[44px] bg-[#060b08] border-b-2 border-[#c8a86b]/30"
                  />

                  {/* LID BACK SKIRT */}
                  <div
                    style={{
                      transform: "rotateY(180deg) translateZ(115px) sm:translateZ(125px)",
                    }}
                    className="absolute inset-0 w-[230px] sm:w-[250px] h-[44px] bg-[#060b08] border-b-2 border-[#c8a86b]/30"
                  />
                </div>

                {/* ── 2. THE 3D HOLLOW BOX BODY (CUBE BASE) ── */}
                <div
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                  className="absolute inset-0 w-[210px] sm:w-[230px] h-[180px] sm:h-[190px]"
                >
                  {/* FRONT FACE (Facing the viewer) */}
                  <div
                    style={{
                      transform: "translateZ(105px) sm:translateZ(115px)",
                    }}
                    className="absolute inset-0 w-[210px] sm:w-[230px] h-[180px] sm:h-[190px] rounded-b-xl bg-gradient-to-b from-[#14231b] via-[#0d1712] to-[#060a08] border-x border-b-2 border-[#c8a86b]/50 shadow-2xl overflow-hidden flex items-center justify-center"
                  >
                    {/* Vertical Ribbon */}
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 sm:w-9 bg-gradient-to-r from-[#9b7835] via-[#fae7b9] to-[#9b7835] shadow-md" />
                    {/* Horizontal Ribbon */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 sm:h-9 bg-gradient-to-b from-[#9b7835] via-[#fae7b9] to-[#9b7835] shadow-md" />

                    {/* Corner Gold Brackets */}
                    <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#c8a86b]/60 pointer-events-none" />
                    <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#c8a86b]/60 pointer-events-none" />
                    <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#c8a86b]/60 pointer-events-none" />
                    <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#c8a86b]/60 pointer-events-none" />

                    {/* Studio Center Monogram */}
                    <div className="relative z-10 w-14 h-14 rounded-full bg-[#060c08]/95 border border-[#c8a86b]/50 flex flex-col items-center justify-center shadow-lg backdrop-blur-xs">
                      <span className="text-xs font-semibold tracking-widest text-[#fae7b9] font-sans">
                        MARI
                      </span>
                      <span className="text-[7px] uppercase tracking-widest text-[#9a9a9a]">
                        STUDIO
                      </span>
                    </div>

                    {/* Hanging Calligraphic Gift Tag */}
                    <div className="absolute bottom-3 right-3 z-20 bg-[#faf7f0] text-[#142018] px-3 py-1.5 rounded-xl shadow-2xl border border-[#c8a86b] text-left rotate-[-4deg] transition-transform duration-300 group-hover:rotate-0">
                      <span className="block text-[7px] uppercase tracking-widest text-[#8b6e2d] font-bold">
                        Recipient
                      </span>
                      <span className="block font-semibold text-[11px] tracking-tight truncate max-w-[95px]">
                        {giftCard.recipientName || "Valued Client"}
                      </span>
                      <span className="block text-[8px] font-mono text-[#8b6e2d] font-bold mt-0.5">
                        ${giftCard.amountCad.toFixed(2)} CAD
                      </span>
                    </div>
                  </div>

                  {/* RIGHT FACE (Gives the cube its authentic 3D depth!) */}
                  <div
                    style={{
                      transform: "rotateY(90deg) translateZ(105px) sm:translateZ(115px)",
                    }}
                    className="absolute inset-0 w-[210px] sm:w-[230px] h-[180px] sm:h-[190px] rounded-b-xl bg-gradient-to-b from-[#0f1b14] via-[#09100c] to-[#040705] border-x border-b-2 border-[#c8a86b]/35 shadow-2xl overflow-hidden flex items-center justify-center"
                  >
                    {/* Right Face Horizontal Ribbon wrap-around */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 sm:h-9 bg-gradient-to-b from-[#7f6024] via-[#d6bc85] to-[#7f6024] shadow-md" />
                    {/* Side Shading Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20 pointer-events-none" />
                  </div>

                  {/* LEFT FACE */}
                  <div
                    style={{
                      transform: "rotateY(-90deg) translateZ(105px) sm:translateZ(115px)",
                    }}
                    className="absolute inset-0 w-[210px] sm:w-[230px] h-[180px] sm:h-[190px] bg-[#050906] border-b border-[#c8a86b]/20"
                  />

                  {/* BACK FACE */}
                  <div
                    style={{
                      transform: "rotateY(180deg) translateZ(105px) sm:translateZ(115px)",
                    }}
                    className="absolute inset-0 w-[210px] sm:w-[230px] h-[180px] sm:h-[190px] bg-[#040705] border-b border-[#c8a86b]/20"
                  />

                  {/* BOTTOM FACE */}
                  <div
                    style={{
                      transform: "rotateX(-90deg) translateZ(90px) sm:translateZ(95px)",
                    }}
                    className="absolute inset-0 w-[210px] sm:w-[230px] h-[210px] sm:h-[230px] bg-[#020403] shadow-[0_30px_60px_rgba(0,0,0,0.9)]"
                  />

                  {/* INSIDE CAVITY FLOOR (Glows with gold and stardust when the lid lifts!) */}
                  <div
                    style={{
                      transform: "rotateX(90deg) translateZ(-85px) sm:translateZ(-90px)",
                    }}
                    className="absolute inset-0 w-[206px] sm:w-[226px] h-[206px] sm:h-[226px] bg-radial from-[#fae7b9]/50 via-[#8052ff]/25 to-[#040805] border border-[#c8a86b]/40 shadow-inner flex items-center justify-center overflow-hidden"
                  >
                    {isOpening && (
                      <div className="w-full h-full bg-radial from-[#fae7b9] via-[#ffb829]/60 to-transparent animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dala Violet Pill Action Button */}
            <div className="mt-8">
              <button
                type="button"
                onClick={() => handleUnwrap()}
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#8052ff] hover:bg-[#6c3ef0] text-white text-xs font-semibold uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(128,82,255,0.4)] hover:shadow-[0_0_55px_rgba(128,82,255,0.7)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Unwrap Gift Box</span>
                <span className="text-sm transition-transform duration-300 group-hover:translate-x-1">✦</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 2: UNWRAPPED CERTIFICATE EMERGED FROM THE BOX ── */}
        {isUnwrapped && (
          <div className="w-full flex flex-col items-center animate-in zoom-in-95 fade-in duration-700">
            {/* Top Eyebrow Status */}
            <div className="mb-6 flex items-center justify-center gap-2 print:hidden">
              <span className="w-2 h-2 rounded-full bg-[#15846e] animate-ping" />
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.28em] uppercase text-[#ffb829]">
                Gift Unboxed · Ready to Redeem
              </span>
            </div>

            {/* 3D TILT MONOLITHIC CERTIFICATE CARD (Emerges From Box) */}
            <div
              ref={containerRef}
              style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: "transform 0.15s ease-out",
              }}
              className="relative w-full max-w-lg rounded-3xl p-7 sm:p-10 bg-[#060606]/95 backdrop-blur-2xl border border-white/10 shadow-[0_35px_90px_rgba(0,0,0,0.9),0_0_50px_rgba(128,82,255,0.18)] text-left overflow-hidden [transform-style:preserve-3d] print:border-2 print:border-black print:shadow-none print:bg-white print:text-black print:p-8"
            >
              {/* Internal Specular Sheen */}
              <div className="pointer-events-none absolute -inset-full bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent rotate-45 transform translate-x-12 translate-y-12 print:hidden" />

              {/* Studio Header & Status */}
              <div className="flex items-start justify-between border-b border-white/10 pb-5 mb-6 print:border-black/20">
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

              {/* Scaled Value Display */}
              <div className="my-5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#ffb829] block mb-1 print:text-black/70">
                  Gift Certificate Value
                </span>
                <div className="flex items-baseline gap-3">
                  <p className="text-5xl sm:text-7xl font-normal text-white tracking-[-0.04em] leading-none print:text-black">
                    ${giftCard.amountCad.toFixed(2)}
                  </p>
                  <span className="text-lg sm:text-2xl font-light text-[#9a9a9a] tracking-widest font-sans print:text-black">
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
                <div className="my-5 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-left print:bg-stone-50 print:border-black/15">
                  <span className="text-[9px] uppercase font-semibold tracking-[0.25em] text-[#9a9a9a] block mb-1.5 print:text-black/70">
                    Personal Note
                  </span>
                  <p className="text-xs sm:text-sm text-white/90 font-extralight italic leading-relaxed print:text-black">
                    “{giftCard.message}”
                  </p>
                </div>
              )}

              {/* Recipient & Sender Row */}
              <div className="grid grid-cols-2 gap-4 py-4 border-t border-white/10 text-xs print:border-black/15">
                <div>
                  <span className="block text-[9px] uppercase font-semibold tracking-[0.25em] text-[#9a9a9a] print:text-black/70">
                    Recipient
                  </span>
                  <p className="font-normal text-white text-sm sm:text-base mt-0.5 print:text-black truncate">
                    {giftCard.recipientName || "Valued Client"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] uppercase font-semibold tracking-[0.25em] text-[#9a9a9a] print:text-black/70">
                    From
                  </span>
                  <p className="font-normal text-white text-sm sm:text-base mt-0.5 print:text-black truncate">
                    {giftCard.senderName || "Mari Esthetics"}
                  </p>
                </div>
              </div>

              {/* Voucher Code Box */}
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.03] p-4 rounded-2xl border border-white/10 print:border-black/20 print:bg-stone-100">
                <div className="text-center sm:text-left">
                  <span className="block text-[8px] uppercase font-semibold tracking-[0.25em] text-[#9a9a9a] print:text-black">
                    Redemption / Coupon Code
                  </span>
                  <span className="font-mono text-lg sm:text-xl font-medium tracking-[0.2em] text-white print:text-black select-all">
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
            <div className="mt-8 w-full max-w-lg space-y-3.5 print:hidden">
              {/* Primary Redeem CTA: Signature Dala Electric Iris Violet Pill */}
              <Link
                href={`/book?coupon=${giftCard.code}`}
                className="w-full py-4 px-8 rounded-full bg-[#8052ff] hover:bg-[#6c3ef0] text-white text-center text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] shadow-[0_0_35px_rgba(128,82,255,0.45)] hover:shadow-[0_0_55px_rgba(128,82,255,0.7)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>Book Appointment with this Gift Card</span>
                <span className="text-base">→</span>
              </Link>

              {/* Secondary Ghost Actions: Print + Wrap Box Again */}
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
                  onClick={handleWrapAgain}
                  className="py-3 px-5 rounded-full border border-white/20 bg-transparent hover:bg-white/5 text-xs font-semibold uppercase tracking-[0.15em] text-[#9a9a9a] hover:text-white cursor-pointer transition-all duration-200"
                  title="Close Box & Wrap Again"
                >
                  ↺ Close Box &amp; Wrap Again
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
