import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = http.createServer((req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const target = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    const relative = path.relative(root, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) { res.writeHead(403); res.end(); return; }
    const stat = statSync(target); if (!stat.isFile()) throw new Error('Not a file');
    const headers = { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
    let start = 0, end = stat.size - 1, status = 200;
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match || (!match[1] && !match[2])) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); res.end(); return; }
      start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
      end = match[1] && match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
      if (start > end || start >= stat.size) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); res.end(); return; }
      status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
    }
    headers['Content-Length'] = String(end - start + 1); res.writeHead(status, headers);
    if (req.method === 'HEAD') { res.end(); return; }
    createReadStream(target, { start, end }).on('error', () => res.destroy()).pipe(res);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('File non trovato. Esegui prima npm run build.'); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Anteprima: http://localhost:${port}/\nChiudi con Ctrl+C.`));
