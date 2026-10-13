"use client";

import { useEffect, useState } from "react";

interface Particle {
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  color: string;
}

const DEFAULT_COLORS = [
  "#c8a86b", // Mari gold
  "#e2c78c", // Champagne
  "#2f6b50", // Studio deep emerald
  "#9dceb8", // Soft mint
  "#f3efe6", // Warm ivory
];

export interface ConfettiEffectProps {
  count?: number;
  colors?: string[];
  mode?: "fixed" | "absolute";
  className?: string;
}

export function ConfettiEffect({
  count = 50,
  colors = DEFAULT_COLORS,
  mode = "fixed",
  className = "",
}: ConfettiEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles client-side on mount to prevent any SSR hydration mismatch
    const generated: Particle[] = Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
      size: 6 + Math.random() * 12,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(generated);
  }, [count, colors]);

  if (particles.length === 0) return null;

  const positionClass = mode === "fixed" ? "fixed" : "absolute";

  return (
    <div
      aria-hidden="true"
      data-print-hidden="true"
      className={`${positionClass} inset-0 overflow-hidden pointer-events-none z-20 print:hidden ${className}`}
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className="mari-confetti-particle absolute top-0 rounded-xs opacity-80"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes mariConfettiFall {
              0% {
                transform: translateY(-20px) rotate(0deg);
                opacity: 0.95;
              }
              85% {
                opacity: 0.8;
              }
              100% {
                transform: translateY(105vh) rotate(720deg);
                opacity: 0;
              }
            }
            .mari-confetti-particle {
              animation: mariConfettiFall linear infinite;
              will-change: transform, opacity;
            }
            @media (prefers-reduced-motion: reduce) {
              .mari-confetti-particle {
                display: none !important;
              }
            }
          `,
        }}
      />
    </div>
  );
}
