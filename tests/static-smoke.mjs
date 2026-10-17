import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://localhost:4173';
const html = await fetch(base + '/'); assert.equal(html.status, 200);
assert.match(await html.text(), /Stefania, la tua prima/);
const media = await fetch(base + '/media/trailer-mobile.mp4', { headers: { Range: 'bytes=0-1023' } });
assert.equal(media.status, 206); assert.equal(media.headers.get('content-type'), 'video/mp4');
assert.match(media.headers.get('content-range'), /^bytes 0-1023\/\d+$/);
const bytes = Buffer.from(await media.arrayBuffer()); assert.equal(bytes.length, 1024); assert.equal(bytes.toString('ascii', 4, 8), 'ftyp');
const invalid = await fetch(base + '/media/trailer-mobile.mp4', { headers: { Range: 'bytes=999999999-' } }); assert.equal(invalid.status, 416);
const frame = await fetch(base + '/media/envelope-final-frame.webp', { method: 'HEAD' }); assert.equal(frame.status, 200); assert.equal(frame.headers.get('content-type'), 'image/webp'); assert.ok(Number(frame.headers.get('content-length')) > 10000);
for (const asset of ['body', 'reel', 'turn-atlas']) {
  const image = await fetch(base + `/media/projector/${asset}.webp`, { method: 'HEAD' });
  assert.equal(image.status, 200); assert.equal(image.headers.get('content-type'), 'image/webp'); assert.ok(Number(image.headers.get('content-length')) > 10000);
}
console.log('Static build OK: HTML, MP4 byte ranges (206/416), final WebP frame.');
