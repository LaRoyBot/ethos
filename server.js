const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.manifest': 'text/cache-manifest',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  // Resolve file path safely
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(__dirname, reqPath === '/' ? 'index.html' : reqPath);
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    
    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
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
