import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../dist/index.js';
import { queryOne, execute } from '../dist/db/index.js';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('1. GET /api/hotel/public-info returns hotel name and logo without authentication', async () => {
  const res = await fetch(`${baseUrl}/api/hotel/public-info`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.name, 'Hotel must have a name');
  assert.ok(data.id, 'Hotel must have an id');
  console.log('Public hotel profile:', { name: data.name, hasLogo: Boolean(data.logo_url) });
});

test('2. GET /api/branding/platform prioritizes hotel name and uploaded logo', async () => {
  const res = await fetch(`${baseUrl}/api/branding/platform`);
  assert.equal(res.status, 200);
  const data = await res.json();
  const hotel = queryOne('SELECT name, logo_url FROM hotels LIMIT 1');
  assert.equal(data.platform_name, hotel.name);
  if (hotel.logo_url) {
    assert.equal(data.logo_url, hotel.logo_url);
  }
});
