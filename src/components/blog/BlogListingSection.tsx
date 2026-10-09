"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogEmptyState } from "@/components/blog/BlogEmptyState";
import { Reveal } from "@/components/public/Reveal";
import type { BlogListItem } from "@/lib/blog/types";

export function BlogListingSection({ initialPosts }: { initialPosts: BlogListItem[] }) {
  const { locale } = useLanguage();
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/public/blogs?language=${locale}&limit=48`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data.success) return;
        setPosts(data.posts || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (!loading && posts.length === 0) {
    return (
      <div className="mt-16">
        <BlogEmptyState />
      </div>
    );
  }

  return (
    <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, i) => (
        <Reveal key={`${post._id}-${locale}`} delay={Math.min(i * 60, 300)}>
          <BlogCard post={post} />
        </Reveal>
      ))}
    </div>
  );
}
