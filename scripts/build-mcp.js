#!/usr/bin/env node
/**
 * Thirdwatch MCP docs builder.
 *
 * Reads content/mcp/**.md (with frontmatter) and emits:
 *   - public/mcp/index.html                    (overview)
 *   - public/mcp/use-cases/{slug}/index.html   (5 ICP pages)
 *   - public/mcp/tools/{tool}/index.html       (20 tool reference pages)
 *
 * Side effects:
 *   - Appends MCP URLs to public/sitemap.xml
 *   - Appends MCP URLs to public/llms.txt
 *
 * Usage:  node scripts/build-mcp.js
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const ROOT = path.resolve(__dirname, "..");
const CONTENT = path.join(ROOT, "content", "mcp");
const PUBLIC = path.join(ROOT, "public");
const TEMPLATES = path.join(ROOT, "templates");
const PAGE_TPL = fs.readFileSync(path.join(TEMPLATES, "mcp-page.html"), "utf8");
const TOOL_TPL = fs.readFileSync(path.join(TEMPLATES, "mcp-tool.html"), "utf8");
const ORIGIN = "https://thirdwatch.dev";

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

function buildWebpageSchema(page) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    url: `${ORIGIN}/${page.path}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Thirdwatch",
      url: ORIGIN,
    },
    publisher: {
      "@type": "Organization",
      name: "Thirdwatch",
      logo: { "@type": "ImageObject", url: `${ORIGIN}/logo-512.png` },
    },
  });
}

function buildSoftwareSchema(page) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `Thirdwatch MCP — ${page.toolName}`,
    description: page.description,
    url: `${ORIGIN}/${page.path}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cloud (MCP server)",
    offers: {
      "@type": "Offer",
      price: "0.01",
      priceCurrency: "USD",
      description: "Pay-per-credit. 100 free credits on signup.",
    },
    publisher: { "@type": "Organization", name: "Thirdwatch", url: ORIGIN },
  });
}

function buildBreadcrumbSchema(page) {
  const list = [
    { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN },
    { "@type": "ListItem", position: 2, name: "MCP", item: `${ORIGIN}/mcp/` },
  ];
  if (page.type === "mcp-use-case") {
    list.push({
      "@type": "ListItem",
      position: 3,
      name: "Use cases",
      item: `${ORIGIN}/mcp/#use-cases`,
    });
    list.push({
      "@type": "ListItem",
      position: 4,
      name: page.title,
      item: `${ORIGIN}/${page.path}`,
    });
  } else if (page.type === "mcp-tool") {
    list.push({
      "@type": "ListItem",
      position: 3,
      name: "Tools",
      item: `${ORIGIN}/mcp/#tools`,
    });
    list.push({
      "@type": "ListItem",
      position: 4,
      name: page.toolName,
      item: `${ORIGIN}/${page.path}`,
    });
  }
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list,
  });
}

function buildFaqSchema(page) {
  // Extract FAQ from rendered HTML if present
  if (page.type !== "mcp-overview") return "{}";
  const faqs = [
    {
      q: "Which clients does Thirdwatch MCP work with?",
      a: "Any MCP-compatible client. Verified: Claude.ai (web + desktop) as a Custom Connector, Claude Code via ~/.claude.json, and Cursor via ~/.cursor/mcp.json. Transport is HTTPS streamable; auth is Bearer token.",
    },
    {
      q: "How fresh is the data?",
      a: "Every tool runs the underlying Apify actor on demand. There is no stale cache. Latency is typically 8–25s for talent tools, 5–12s for ecommerce, 3–8s for businesses.",
    },
    {
      q: "What does Thirdwatch MCP cost?",
      a: "Pay-per-result. 100 free credits on signup. $0.01 per credit beyond the free tier. A typical search_candidates call is 3 credits ($0.03). A 14-source search_jobs is ~22 credits ($0.22).",
    },
    {
      q: "What countries are covered?",
      a: "Most tools are global. Real estate is currently India + UK. India compliance (verify_business) is India-only. Naukri, JustDial, IndiaMart, AmbitionBox, Cutshort are India-focused. LinkedIn, Indeed, Amazon, AliExpress, Google Maps work in 100+ countries.",
    },
    {
      q: "What are the rate limits?",
      a: "5 concurrent requests per API key, 1000 requests/hour. Higher limits on annual plans.",
    },
  ];
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

function breadcrumbHtml(page) {
  if (page.type === "mcp-overview") {
    return `<a href="/">Home</a> <span>/</span> <span>MCP</span>`;
  }
  if (page.type === "mcp-use-case") {
    return `<a href="/">Home</a> <span>/</span> <a href="/mcp/">MCP</a> <span>/</span> <a href="/mcp/#use-cases">Use cases</a> <span>/</span> <span>${escapeHtml(page.icpLabel || page.title)}</span>`;
  }
  if (page.type === "mcp-tool") {
    return `<a href="/">Home</a> <span>/</span> <a href="/mcp/">MCP</a> <span>/</span> <a href="/mcp/#tools">Tools</a> <span>/</span> <span>${escapeHtml(page.toolName)}</span>`;
  }
  return "";
}

function readMarkdownDir(dir, prefix = "") {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...readMarkdownDir(full, prefix + entry.name + "/"));
    } else if (entry.name.endsWith(".md")) {
      out.push({ file: full, relpath: prefix + entry.name });
    }
  }
  return out;
}

function renderMcpPage(file) {
  const raw = fs.readFileSync(file, "utf8");
  const parsed = matter(raw);
  const fm = parsed.data;
  const body = parsed.content;

  if (!fm.path || !fm.title) {
    throw new Error(`${file}: missing path or title in frontmatter`);
  }

  const html = marked.parse(body);
  const page = {
    title: fm.title,
    description: fm.description || "",
    path: fm.path.replace(/^\/+/, "").replace(/\/?$/, "/"),
    type: fm.type,
    keywords: Array.isArray(fm.keywords) ? fm.keywords.join(", ") : (fm.keywords || ""),
    content: html,
    icp: fm.icp,
    icpLabel: fm.icpLabel || fm.title,
    cluster: fm.cluster,
    clusterLabel: fm.clusterLabel || "",
    cost_credits: fm.cost_credits || "",
    costLabel: fm.costLabel || fm.cost_credits || "",
    toolName: fm.toolName || "",
    actorsLabel: fm.actorsLabel || "",
  };

  page.webpageSchema = buildWebpageSchema(page);
  page.breadcrumbSchema = buildBreadcrumbSchema(page);
  page.faqSchema = buildFaqSchema(page);
  page.softwareSchema = buildSoftwareSchema(page);
  page.breadcrumbsHtml = breadcrumbHtml(page);

  let rendered;
  if (page.type === "mcp-tool") {
    rendered = fillTemplate(TOOL_TPL, page);
  } else {
    rendered = fillTemplate(PAGE_TPL, page);
  }

  // Output path: strip trailing slash, write {dir}/index.html
  const outDir = path.join(PUBLIC, page.path.replace(/\/$/, ""));
  ensureDir(outDir);
  fs.writeFileSync(path.join(outDir, "index.html"), rendered);
  return page;
}

function updateSitemap(pages) {
  const sitemapPath = path.join(PUBLIC, "sitemap.xml");
  let xml;
  try {
    xml = fs.readFileSync(sitemapPath, "utf8");
  } catch {
    xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n`;
  }

  // Remove any existing /mcp/ URLs to avoid duplication
  xml = xml.replace(/  <url>\n    <loc>https:\/\/thirdwatch\.dev\/mcp[^\n]*<\/loc>\n[\s\S]*?  <\/url>\n?/g, "");

  const today = new Date().toISOString().slice(0, 10);
  const inserts = pages
    .map((p) => {
      let priority = "0.7";
      if (p.type === "mcp-overview") priority = "0.9";
      else if (p.type === "mcp-use-case") priority = "0.8";
      return `  <url>\n    <loc>${ORIGIN}/${p.path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>\n`;
    })
    .join("");

  // Insert before </urlset>
  xml = xml.replace(/<\/urlset>\s*$/, inserts + "</urlset>\n");
  fs.writeFileSync(sitemapPath, xml);
}

function updateLlmsTxt(pages) {
  const llmsPath = path.join(PUBLIC, "llms.txt");
  let txt;
  try {
    txt = fs.readFileSync(llmsPath, "utf8");
  } catch {
    txt = "# Thirdwatch\n\n";
  }

  // Remove any prior MCP block
  txt = txt.replace(/\n## Thirdwatch MCP[\s\S]*?(?=\n## |\n# |$)/g, "");

  const overview = pages.find((p) => p.type === "mcp-overview");
  const useCases = pages.filter((p) => p.type === "mcp-use-case");
  const tools = pages.filter((p) => p.type === "mcp-tool");

  let block = "\n## Thirdwatch MCP\n";
  block += "Remote MCP server with 20 tools backed by 54 Apify scrapers. Pay-per-result.\n";
  block += `- Endpoint: https://mcp.thirdwatch.dev/mcp\n`;
  block += `- Docs: ${ORIGIN}/mcp/\n`;
  if (overview) block += `- Overview: ${ORIGIN}/${overview.path}\n`;
  block += "\n### MCP use-case guides\n";
  for (const p of useCases) {
    block += `- ${p.title}: ${ORIGIN}/${p.path}\n`;
  }
  block += "\n### MCP tool reference\n";
  for (const p of tools) {
    block += `- ${p.toolName}: ${ORIGIN}/${p.path}\n`;
  }
  block += "\n";

  // Append (or insert before next ## section)
  txt = txt.replace(/\n*$/, "") + block;
  fs.writeFileSync(llmsPath, txt);
}

function main() {
  if (!fs.existsSync(CONTENT)) {
    console.log("No content/mcp/ directory. Nothing to do.");
    return;
  }
  const files = readMarkdownDir(CONTENT);
  const pages = [];
  for (const { file, relpath } of files) {
    try {
      const page = renderMcpPage(file);
      pages.push(page);
      console.log(`✓ ${relpath} → /${page.path}`);
    } catch (err) {
      console.error(`✗ ${relpath}: ${err.message}`);
      process.exitCode = 1;
    }
  }

  // Sort: overview, use-cases, tools (for consistent sitemap output)
  pages.sort((a, b) => {
    const order = { "mcp-overview": 0, "mcp-use-case": 1, "mcp-tool": 2 };
    const ao = order[a.type] ?? 9;
    const bo = order[b.type] ?? 9;
    if (ao !== bo) return ao - bo;
    return a.path.localeCompare(b.path);
  });

  updateSitemap(pages);
  updateLlmsTxt(pages);

  console.log(`\nBuilt ${pages.length} MCP page(s). Sitemap + llms.txt updated.`);
}

main();
