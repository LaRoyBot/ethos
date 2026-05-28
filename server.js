const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.manifest': 'text/cache-manifest; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  
  // 1. Safe URI decoding to prevent traversal bypass via URL encoded dots/slashes
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(reqPath);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }
  
  // 2. Normalize and check if file path stays within root directory to prevent directory traversal
  const rootPath = path.resolve(__dirname);
  const filePath = path.normalize(path.join(rootPath, decodedPath === '/' ? 'index.html' : decodedPath));
  
  if (!filePath.startsWith(rootPath + path.sep) && filePath !== rootPath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    
    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Server Error: ' + error.code);
        return;
      }
      
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private'
      });
      res.end(content, 'utf-8');
    });
  });
});

server.listen(PORT, () => {
  console.log(`[Server] ethos.init v2.4.0 is running at http://localhost:${PORT}`);
});
