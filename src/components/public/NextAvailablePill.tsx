"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface NextAvailableData {
  success: boolean;
  date?: string;
  time?: string;
  formattedLabel?: string;
  serviceId?: string;
  serviceSlug?: string;
}

export function NextAvailablePill() {
  const router = useRouter();
  const [data, setData] = useState<NextAvailableData | null>(null);

  useEffect(() => {
    fetch("/api/public/next-available")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData);
        }
      })
      .catch(() => {});
  }, []);

  if (!data || !data.formattedLabel) return null;

  function handleClick() {
    if (!data) return;
    const { date, time, serviceId, serviceSlug } = data;
    const query = new URLSearchParams();
    if (date) query.set("date", date);
    if (time) query.set("time", time);
    if (serviceSlug) query.set("service", serviceSlug);
    else if (serviceId) query.set("serviceId", serviceId);

    router.push(`/book?${query.toString()}`);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#c8a86b]/50 bg-black/40 dark:bg-black/60 backdrop-blur-md text-white text-[11px] font-bold shadow-lg hover:border-[#c8a86b] hover:bg-[#c8a86b]/20 transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-top-2"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-[#c8a86b] tracking-wider uppercase font-extrabold text-[10px]">
        ⚡ Next Open Slot:
      </span>
      <span className="text-white/90 font-medium group-hover:text-white transition-colors">
        {data.formattedLabel}
      </span>
      <span className="text-[#c8a86b] group-hover:translate-x-0.5 transition-transform">
        →
      </span>
    </button>
  );
}
