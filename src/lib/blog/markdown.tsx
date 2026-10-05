import type { ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+?\*\*|\*[^*]+?\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }

    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-[var(--ink)]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*")) {
      nodes.push(
        <em key={`${keyPrefix}-i-${i}`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (match[2] && match[3]) {
      const href = match[3];
      const external = /^https?:\/\//i.test(href);
      nodes.push(
        <a
          key={`${keyPrefix}-a-${i}`}
          href={href}
          className="text-[#c8a86b] underline underline-offset-2 hover:text-[var(--ink)]"
          {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        >
          {match[2]}
        </a>
      );
    }

    last = match.index + token.length;
    i += 1;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return nodes;
}

export function MarkdownContent({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    const items = listItems;
    listItems = [];
    blocks.push(
      <ul key={`ul-${key++}`} className="my-5 list-disc space-y-2 pl-5 text-[var(--ink)]">
        {items.map((item, idx) => (
          <li key={`li-${key}-${idx}`}>{renderInline(item, `li-${key}-${idx}`)}</li>
        ))}
      </ul>
    );
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (/^[-*]\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-*]\s+/, ""));
      continue;
    }

    flushList();

    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push(
        <h3
          key={`h3-${key++}`}
          className="mt-8 mb-3 font-[family-name:var(--font-display)] text-xl text-[var(--ink)] md:text-2xl"
        >
          {renderInline(trimmed.slice(4), `h3-${key}`)}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push(
        <h2
          key={`h2-${key++}`}
          className="mt-10 mb-4 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)] md:text-3xl"
        >
          {renderInline(trimmed.slice(3), `h2-${key}`)}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith("# ")) {
      blocks.push(
        <h2
          key={`h1-${key++}`}
          className="mt-10 mb-4 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)] md:text-3xl"
        >
          {renderInline(trimmed.slice(2), `h1-${key}`)}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={`q-${key++}`}
          className="my-6 border-l-2 border-[#c8a86b] pl-4 italic text-[var(--ink-soft)]"
        >
          {renderInline(trimmed.slice(2), `q-${key}`)}
        </blockquote>
      );
      continue;
    }

    blocks.push(
      <p key={`p-${key++}`} className="my-4 text-[15px] leading-relaxed text-[var(--ink-soft)] md:text-base">
        {renderInline(trimmed, `p-${key}`)}
      </p>
    );
  }

  flushList();

  return <div className={className}>{blocks}</div>;
}
