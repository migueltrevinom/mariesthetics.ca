import { test } from "node:test";
import assert from "node:assert/strict";
import { enhancePostHtml } from "./enhance";

test("anchors, toc, alt fallback, quick answers", () => {
  const r = enhancePostHtml(
    `<p>First para here.</p><h2>Why it matters</h2><p>x</p><img src="/a.jpg"><img src="/b.jpg" alt="Real alt"><h2>Respuestas rápidas</h2><p><strong>¿Cuánto?</strong> $70.</p><p><strong>¿Cada cuánto?</strong> 2–3 semanas.</p><h2>Reserva</h2><p>y</p>`,
    "Classic Set en el oeste de Edmonton – T"
  );
  assert.deepEqual(r.toc.map((t) => t.id), ["why-it-matters", "respuestas-rápidas", "reserva"]);
  assert.match(r.html, /<h2 id="why-it-matters">/);
  assert.match(r.html, /src="\/a.jpg" alt="Classic Set en el oeste de Edmonton – T"/);
  assert.equal(r.inlineImages[1].alt, "Real alt");
  assert.deepEqual(r.faqs, [{ q: "¿Cuánto?", a: "$70." }, { q: "¿Cada cuánto?", a: "2–3 semanas." }]);
  assert.equal(r.firstParagraph, "First para here.");
});

test("plain content converts", () => {
  const r = enhancePostHtml("Intro line\n\n## Heading one\n\nBody", "alt");
  assert.equal(r.toc[0].text, "Heading one");
  assert.match(r.html, /<p class="blog-p">Intro line<\/p>/);
});
