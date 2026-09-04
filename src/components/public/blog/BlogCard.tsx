import Link from "next/link";
import Image from "next/image";

export type BlogCardPost = {
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  publishedAt?: string | Date | null;
  category?: string;
  author?: string;
};

function formatDate(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BlogCard({ post }: { post: BlogCardPost }) {
  const dateLabel = formatDate(post.publishedAt);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group card overflow-hidden flex flex-col h-full transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--mist)]">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#c8a86b]/20 to-[var(--mist)]" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#c8a86b] font-semibold">
          {post.category ? <span>{post.category}</span> : null}
          {post.category && dateLabel ? <span className="text-[var(--ink-faint)]">·</span> : null}
          {dateLabel ? <span className="text-[var(--ink-faint)]">{dateLabel}</span> : null}
        </div>
        <h2 className="font-[family-name:var(--font-display)] mt-3 text-2xl leading-tight text-[var(--ink)] group-hover:text-[#c8a86b] transition-colors">
          {post.title}
        </h2>
        {post.excerpt ? (
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)] line-clamp-3">
            {post.excerpt}
          </p>
        ) : null}
        <span className="mt-auto pt-5 text-xs font-semibold uppercase tracking-wider text-[#c8a86b]">
          Read article →
        </span>
      </div>
    </Link>
  );
}
