// Servidor local de desarrollo.
// Uso: node serve.js [puerto] [carpeta]   ->  http://localhost:8080
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = Number(process.argv[2]) || 8080;
const ROOT = path.resolve(process.argv[3] || __dirname);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.txt':'text/plain', '.xml':'application/xml', '.jpg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.woff2':'font/woff2' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, path.normalize(p));
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
    res.end(d);
  });
}).listen(PORT, () => console.log('http://localhost:' + PORT + '  (' + ROOT + ')'));
