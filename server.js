const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json",
};

http
  .createServer((req, res) => {
    let filePath = path.join(
      __dirname,
      "public",
      req.url === "/" ? "index.html" : req.url
    );
    const ext = path.extname(filePath);
    const contentType = MIME[ext] || "application/octet-stream";

    fs.readFile(filePath, (err, data) => {
      if (err) {
        // Serve index.html for any unknown route
        fs.readFile(path.join(__dirname, "public", "index.html"), (e, d) => {
          res.writeHead(e ? 404 : 200, { "Content-Type": "text/html" });
          res.end(e ? "Not Found" : d);
        });
        return;
      }
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`Thirdwatch running on port ${PORT}`));
