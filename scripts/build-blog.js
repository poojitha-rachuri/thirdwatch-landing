#!/usr/bin/env node
/**
 * Thirdwatch blog builder.
 *
 * Reads content/blog/*.md (with frontmatter) and emits:
 *   - public/blog/{slug}/index.html  (one per post)
 *   - public/blog/index.html         (hub page, grouped by category)
 *   - public/sitemap.xml             (site-wide sitemap)
 *   - public/llms.txt                (canonical URLs for LLM crawlers)
 *
 * No frameworks. Just marked + gray-matter.
 *
 * Usage:  node scripts/build-blog.js
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const ROOT = path.resolve(__dirname, "..");
const CONTENT = path.join(ROOT, "content", "blog");
const PUBLIC = path.join(ROOT, "public");
const TEMPLATES = path.join(ROOT, "templates");
const POST_TPL = fs.readFileSync(path.join(TEMPLATES, "post.html"), "utf8");
const HUB_TPL = fs.readFileSync(path.join(TEMPLATES, "hub.html"), "utf8");
const ORIGIN = "https://thirdwatch.dev";

const CATEGORIES = {
  jobs: "Jobs & recruitment",
  ecommerce: "E-commerce & products",
  reviews: "Reviews & ratings",
  social: "Social media",
  business: "Business & local data",
  food: "Food delivery",
  "real-estate": "Real estate",
  compliance: "Compliance & registries",
  other: "Other",
};

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fillTemplate(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    vars[k] === undefined ? "" : String(vars[k])
  );
}

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function buildArticleSchema(post) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: `${ORIGIN}/og-default.png`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: { "@type": "Organization", name: "Thirdwatch" },
    publisher: {
      "@type": "Organization",
      name: "Thirdwatch",
      logo: { "@type": "ImageObject", url: `${ORIGIN}/logos/thirdwatch.svg` },
    },
    mainEntityOfPage: `${ORIGIN}/blog/${post.slug}`,
  });
}

function buildFaqSchema(faqs) {
  if (!Array.isArray(faqs) || !faqs.length) return "{}";
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });
}

function buildBreadcrumbSchema(post) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${ORIGIN}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${ORIGIN}/blog/${post.slug}`,
      },
    ],
  });
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderPost(file) {
  const raw = fs.readFileSync(path.join(CONTENT, file), "utf8");
  const parsed = matter(raw);
  const fm = parsed.data;
  const body = parsed.content;

  if (!fm.slug || !fm.title) {
    throw new Error(`${file}: missing slug or title in frontmatter`);
  }

  const html = marked.parse(body);
  const wc = wordCount(body);

  const post = {
    slug: fm.slug,
    title: fm.title,
    description: fm.description || "",
    actor: fm.actor || "",
    actor_url: fm.actor_url || `https://apify.com/thirdwatch/${fm.actor}`,
    actorTitle: fm.actorTitle || (fm.actor ? fm.actor.replace(/-/g, " ") : ""),
    category: fm.category || "other",
    audience: fm.audience || "developers",
    publishedAt: fm.publishedAt || new Date().toISOString().slice(0, 10),
    updatedAt: fm.updatedAt || fm.publishedAt || new Date().toISOString().slice(0, 10),
    publishedDisplay: formatDate(fm.publishedAt),
    keywords: Array.isArray(fm.keywords) ? fm.keywords.join(", ") : "",
    related: fm.related || [],
    faqs: fm.faqs || [],
    medium_status: fm.medium_status || "pending",
    content: html,
    wordCount: wc,
  };

  post.articleSchema = buildArticleSchema(post);
  post.faqSchema = buildFaqSchema(post.faqs);
  post.breadcrumbSchema = buildBreadcrumbSchema(post);

  const rendered = fillTemplate(POST_TPL, post);

  const outDir = path.join(PUBLIC, "blog", post.slug);
  ensureDir(outDir);
  fs.writeFileSync(path.join(outDir, "index.html"), rendered);
  return post;
}

function renderHub(posts) {
  const byCategory = {};
  for (const p of posts) {
    (byCategory[p.category] ||= []).push(p);
  }
  const order = Object.keys(CATEGORIES);
  let sections = "";
  for (const cat of order) {
    const list = byCategory[cat];
    if (!list || !list.length) continue;
    list.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
    sections += `<section class="hub-category">\n<h2>${CATEGORIES[cat]}</h2>\n<ul class="hub-posts">\n`;
    for (const p of list) {
      sections += `<li><a href="/blog/${p.slug}"><strong>${escapeHtml(p.title)}</strong><br><span class="hub-desc">${escapeHtml(p.description)}</span></a></li>\n`;
    }
    sections += `</ul>\n</section>\n`;
  }
  if (!sections) {
    sections = `<p>No posts yet. Come back soon — we're publishing weekly use-case guides for every Thirdwatch scraper.</p>`;
  }
  const html = fillTemplate(HUB_TPL, { categorySections: sections });
  ensureDir(path.join(PUBLIC, "blog"));
  fs.writeFileSync(path.join(PUBLIC, "blog", "index.html"), html);
}

function buildSitemap(posts) {
  const urls = [
    { loc: `${ORIGIN}/`, priority: "1.0" },
    { loc: `${ORIGIN}/blog`, priority: "0.9" },
  ];
  for (const p of posts) {
    urls.push({
      loc: `${ORIGIN}/blog/${p.slug}`,
      lastmod: p.updatedAt,
      priority: "0.8",
    });
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ""}    <priority>${u.priority}</priority>\n  </url>`
  )
  .join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(PUBLIC, "sitemap.xml"), xml);
}

function buildLlmsTxt(posts) {
  const lines = [
    "# Thirdwatch — web scraping APIs",
    "",
    "Thirdwatch publishes 48 production-grade web scrapers as Apify actors. Pay-per-result, no infrastructure to manage.",
    "",
    "## Apify Store",
    "- https://apify.com/thirdwatch",
    "",
    "## Blog (use-case guides)",
    `- ${ORIGIN}/blog`,
    "",
  ];
  if (posts.length) {
    lines.push("## Use-case guides");
    for (const p of posts) {
      lines.push(`- ${p.title}: ${ORIGIN}/blog/${p.slug}`);
    }
  }
  fs.writeFileSync(path.join(PUBLIC, "llms.txt"), lines.join("\n") + "\n");
}

function main() {
  if (!fs.existsSync(CONTENT)) {
    console.log("No content/blog/ directory yet. Creating empty.");
    ensureDir(CONTENT);
  }
  const files = fs
    .readdirSync(CONTENT)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const posts = [];
  for (const file of files) {
    try {
      const post = renderPost(file);
      posts.push(post);
      console.log(`✓ ${post.slug} (${post.wordCount} words)`);
    } catch (err) {
      console.error(`✗ ${file}: ${err.message}`);
      process.exitCode = 1;
    }
  }

  renderHub(posts);
  buildSitemap(posts);
  buildLlmsTxt(posts);
  console.log(`\nBuilt ${posts.length} post(s). Hub: /blog/. Sitemap: /sitemap.xml. llms.txt written.`);
}

main();
