import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), 'browser');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = http.createServer(async (request, response) => {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405).end('Method not allowed');
      return;
    }
    let path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (path === '/') path = '/index.html';
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root + sep) || path.includes('\0')) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const data = await readFile(file);
    response.writeHead(200, {
      'Content-Type': (types[extname(file)] || 'application/octet-stream') + '; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch {
    response.writeHead(404).end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log('Nova Striker lab: http://127.0.0.1:' + port));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
