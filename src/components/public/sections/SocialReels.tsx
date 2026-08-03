"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/public/Reveal";

type Reel = {
  _id: string;
  platform: string;
  videoUrl: string;
  thumbnailUrl: string;
  externalUrl: string;
  caption: string;
  serviceName: string;
};

export function SocialReels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [visible, setVisible] = useState(false);
  const [lightbox, setLightbox] = useState<Reel | null>(null);

  useEffect(() => {
    fetch("/api/public/reels")
      .then((res) => res.json())
      .then((data) => {
        if (data.showcaseVisible && Array.isArray(data.reels) && data.reels.length > 0) {
          setReels(data.reels);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lightbox]);

  if (!visible || reels.length === 0) return null;

  return (
    <>
      <section className="relative bg-[var(--background)] py-24 md:py-32 overflow-hidden transition-colors duration-200">
        {/* Subtle gradient accent */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#c8a86b]/[0.04] via-transparent to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 md:px-10">
          <Reveal>
            <p className="eyebrow">Follow the glow</p>
            <h2 className="display mt-4 max-w-2xl text-4xl text-[var(--ink)] md:text-5xl">
              Behind the scenes at the studio.
            </h2>
            <p className="mt-4 text-sm text-[var(--ink-soft)] max-w-lg leading-relaxed">
              Watch real treatments, transformations, and day-in-the-life moments from our Instagram &amp; TikTok.
            </p>
          </Reveal>

          {/* Horizontal scroll band */}
          <div className="mt-14 -mx-6 md:-mx-10 px-6 md:px-10 overflow-x-auto scroll-smooth scrollbar-none">
            <div className="flex gap-4 pb-4" style={{ width: "max-content" }}>
              {reels.map((reel, i) => (
                <Reveal key={reel._id} delay={i * 80}>
                  <button
                    type="button"
                    onClick={() => setLightbox(reel)}
                    className="group relative flex-shrink-0 w-[200px] md:w-[220px] rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.03] hover:border-[#c8a86b]/40 cursor-pointer text-left"
                    style={{ aspectRatio: "9/16" }}
                  >
                    {/* Thumbnail */}
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.caption || "Studio reel"}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-lg border border-white/20 flex items-center justify-center shadow-2xl">
                        <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>

                    {/* Platform badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                          reel.platform === "instagram"
                            ? "bg-gradient-to-r from-purple-600/80 to-pink-500/80 text-white"
                            : "bg-black/60 text-white border border-white/10"
                        }`}
                      >
                        {reel.platform === "instagram" ? "Instagram" : "TikTok"}
                      </span>
                    </div>

                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      {reel.serviceName && (
                        <span className="inline-block text-[10px] font-bold text-[#c8a86b] bg-[#c8a86b]/15 backdrop-blur-sm px-2 py-0.5 rounded-md border border-[#c8a86b]/20 mb-2">
                          {reel.serviceName}
                        </span>
                      )}
                      {reel.caption && (
                        <p className="text-xs text-white/90 font-semibold leading-snug line-clamp-2 drop-shadow-lg">
                          {reel.caption}
                        </p>
                      )}
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Lightbox Video Modal ── */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-sm w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            style={{ aspectRatio: "9/16", maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={lightbox.videoUrl}
              autoPlay
              playsInline
              controls
              className="absolute inset-0 w-full h-full object-cover bg-black"
              poster={lightbox.thumbnailUrl}
            />

            {/* Close button */}
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-sm hover:bg-black/70 transition-colors z-10 cursor-pointer"
            >
              ✕
            </button>

            {/* Bottom info bar */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    lightbox.platform === "instagram"
                      ? "bg-gradient-to-r from-purple-600/80 to-pink-500/80 text-white"
                      : "bg-white/10 text-white"
                  }`}
                >
                  {lightbox.platform === "instagram" ? "Instagram" : "TikTok"}
                </span>
                {lightbox.serviceName && (
                  <span className="text-[10px] font-bold text-[#c8a86b]">
                    {lightbox.serviceName}
                  </span>
                )}
              </div>
              {lightbox.caption && (
                <p className="text-sm text-white/90 font-semibold leading-snug">
                  {lightbox.caption}
                </p>
              )}
            </div>

            {/* External link */}
            {lightbox.externalUrl && (
              <a
                href={lightbox.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold hover:bg-black/70 transition-colors z-10 pointer-events-auto flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <span>↗</span> View Original
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
