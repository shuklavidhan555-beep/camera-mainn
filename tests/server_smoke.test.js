import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

// Minimal static file server for testing dist output
const distDir = path.resolve('dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.mp4': 'video/mp4',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size
      });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks)
        });
      });
    }).on('error', reject);
  });
}

test('Production Build Static Serving Verification', async (t) => {
  const { server, port } = await startServer();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await t.test('GET / (Index HTML)', async () => {
      const res = await fetchUrl(`${baseUrl}/`);
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'text/html');
      const html = res.body.toString('utf8');
      assert.ok(html.includes('SmartCity Command Center'), 'Must include platform title');
      assert.ok(html.includes('<div id="root"></div>'), 'Must include React mount target');
    });

    await t.test('GET /data/integrated_dataset.json', async () => {
      const res = await fetchUrl(`${baseUrl}/data/integrated_dataset.json`);
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'application/json');
      const json = JSON.parse(res.body.toString('utf8'));
      assert.equal(json.cameras.length, 52);
      assert.equal(json.totalVehiclesToday, 23801);
    });

    await t.test('GET /videos/cam_downtown_cmc.mp4 (Real CCTV feed streaming check)', async () => {
      const res = await fetchUrl(`${baseUrl}/videos/cam_downtown_cmc.mp4`);
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'video/mp4');
      assert.ok(Number(res.headers['content-length']) > 5000000, 'Video file should be > 5MB');
    });

    await t.test('GET /incidents/accident_detection.jpg (Incident forensic snapshot check)', async () => {
      const res = await fetchUrl(`${baseUrl}/incidents/accident_detection.jpg`);
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'image/jpeg');
      assert.ok(res.body.length > 10000, 'Snapshot image should be valid');
    });
  } finally {
    server.close();
  }
});
