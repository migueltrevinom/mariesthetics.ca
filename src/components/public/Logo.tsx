const SIZES = {
  sm: "text-sm md:text-[0.95rem] tracking-[0.34em]",
  md: "text-base md:text-lg tracking-[0.38em]",
  lg: "text-xl md:text-2xl tracking-[0.4em]",
};

export function Logo({
  size = "md",
  tagline = false,
  className = "",
}: {
  size?: keyof typeof SIZES;
  tagline?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span
        className={`font-[family-name:var(--font-body)] font-semibold uppercase text-ivory ${SIZES[size]}`}
      >
        Mari&nbsp;Esthetics
      </span>
      {tagline && (
        <span className="mt-2 text-[0.55rem] font-medium uppercase tracking-[0.5em] text-gold">
          Edmonton
        </span>
      )}
    </span>
  );
}
