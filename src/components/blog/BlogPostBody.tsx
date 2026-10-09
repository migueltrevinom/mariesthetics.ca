function looksLikeHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

function renderPlainContent(content: string) {
  const blocks = content.split(/\n\n+/).filter((b) => b.trim());

  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={i} className="blog-h2">
          {trimmed.replace(/^##\s+/, "")}
        </h2>
      );
    }
    if (trimmed.startsWith("### ")) {
      return (
        <h3 key={i} className="blog-h3">
          {trimmed.replace(/^###\s+/, "")}
        </h3>
      );
    }
    return (
      <p key={i} className="blog-p">
        {trimmed.split("\n").map((line, j) => (
          <span key={j}>
            {line}
            {j < trimmed.split("\n").length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
    );
  });
}

export function BlogPostBody({ content }: { content: string }) {
  if (!content.trim()) {
    return null;
  }

  if (looksLikeHtml(content)) {
    return (
      <div
        className="blog-prose"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return <div className="blog-prose">{renderPlainContent(content)}</div>;
}
