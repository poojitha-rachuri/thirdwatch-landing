const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain",
};

function send(res, status, contentType, body) {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(body);
}

function serveFile(filePath, res, fallback) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (fallback) return fallback();
      return send(res, 404, "text/html", "Not Found");
    }
    const ext = path.extname(filePath);
    send(res, 200, MIME[ext] || "application/octet-stream", data);
  });
}

http
  .createServer((req, res) => {
    const url = req.url.split("?")[0];

    // Root
    if (url === "/") return serveFile(path.join(PUBLIC, "index.html"), res);

    // /scrapers/{slug} → Apify Store (until per-actor landing pages ship)
    const scraperMatch = url.match(/^\/scrapers\/([a-z0-9-]+)\/?$/);
    if (scraperMatch) {
      res.writeHead(302, {
        Location: `https://apify.com/thirdwatch/${scraperMatch[1]}`,
      });
      return res.end();
    }

    // Directory-style URLs (no trailing slash, no extension): try /index.html
    const ext = path.extname(url);
    if (!ext) {
      const cleaned = url.replace(/\/$/, "");
      const indexPath = path.join(PUBLIC, cleaned, "index.html");
      return serveFile(indexPath, res, () => {
        // Fallback to public/{path}.html (e.g. /privacy → /privacy.html)
        const htmlPath = path.join(PUBLIC, cleaned + ".html");
        serveFile(htmlPath, res, () => {
          // Final fallback: 404 page or root index
          serveFile(path.join(PUBLIC, "index.html"), res);
        });
      });
    }

    // Direct file with extension
    const filePath = path.join(PUBLIC, url);
    serveFile(filePath, res, () => {
      serveFile(path.join(PUBLIC, "index.html"), res);
    });
  })
  .listen(PORT, () => console.log(`Thirdwatch running on port ${PORT}`));
