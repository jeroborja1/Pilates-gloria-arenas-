// Servidor local de desarrollo.
// Uso: node serve.js [puerto] [carpeta]   ->  http://localhost:8080
// Aplica las cabeceras de vercel.json para probar la política de seguridad antes de publicar.
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = Number(process.argv[2]) || 8080;
const ROOT = path.resolve(process.argv[3] || __dirname);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.txt':'text/plain', '.xml':'application/xml', '.jpg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.woff2':'font/woff2' };
let rules = [];
try { rules = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')).headers || []; } catch (e) {}
const toRe = (src) => new RegExp('^' + src.replace(/\(\.\*\)/g, '.*').replace(/\((\w+)\|(\w+)\)/g, '(?:$1|$2)') + '$');
const compiled = rules.map(r => ({ re: toRe(r.source), headers: r.headers }));
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, path.normalize(p));
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  const h = { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' };
  compiled.forEach(c => { if (c.re.test(p)) c.headers.forEach(x => { h[x.key] = x.value; }); });
  fs.readFile(f, (e, d) => {
    if (e) {
      return fs.readFile(path.join(ROOT, '404.html'), (e2, d2) => { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(e2 ? 'No encontrado' : d2); });
    }
    res.writeHead(200, h);
    res.end(d);
  });
}).listen(PORT, () => console.log('http://localhost:' + PORT + '  (' + ROOT + ')'));
