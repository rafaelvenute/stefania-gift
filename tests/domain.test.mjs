import test from 'node:test';
import assert from 'node:assert/strict';
import { localDay, parseDay, isFutureDay, readAvailability, shareText } from '../src/dates.ts';
import { submitAvailability } from '../src/submission.ts';
import { projectorSamples } from '../src/sound/projector.ts';
const data = { dates: ['2099-11-02', '2099-10-25', '2099-11-02'], preference: 'Sera', message: 'Messaggio di test' };

test('The original projector sound is finite, bounded and free from a DC offset', () => {
  const samples = projectorSamples();
  let peak = 0, sum = 0, energy = 0;
  for (const sample of samples) { assert.ok(Number.isFinite(sample)); peak = Math.max(peak, Math.abs(sample)); sum += sample; energy += sample * sample; }
  assert.ok(peak < .85 && peak > .1);
  assert.ok(Math.abs(sum / samples.length) < .004);
  assert.ok(Math.sqrt(energy / samples.length) > .01);
});

test('Local calendar keys preserve the day, including the daylight-saving boundary', () => {
  for (const key of ['2026-03-29', '2026-10-25', '2028-02-29', '2099-12-31']) assert.equal(localDay(parseDay(key)), key);
  assert.equal(localDay(new Date(2026, 9, 25, 0, 1)), '2026-10-25');
});
test('Only real future days are selectable', () => {
  assert.equal(isFutureDay(localDay()), false);
  for (const key of ['2020-10-12', '2099-02-31', '2099-13-01', 'hello']) assert.equal(isFutureDay(key), false);
  assert.equal(isFutureDay('2099-10-25'), true);
});
test('Stored availability is restored, deduplicated and sanitised', () => {
  globalThis.localStorage = { getItem: () => JSON.stringify({ dates: [...data.dates, '2020-01-01', null, '2099-02-31'], preference: 'Sera', message: 'test' }) };
  assert.deepEqual(readAvailability('test').dates, ['2099-10-25', '2099-11-02']);
  globalThis.localStorage = { getItem: () => '{invalid' };
  assert.deepEqual(readAvailability('test'), { dates: [], preference: 'Indifferente', message: '' });
  globalThis.localStorage = { getItem: () => { throw new Error('Storage disabled'); } };
  assert.equal(readAvailability('test').dates.length, 0);
});
test('Manual sharing includes the name, dates, preference and note without a reservation claim', () => {
  const text = shareText(data);
  assert.match(text, /Stefania D'Amore/); assert.match(text, /Orario: Sera/); assert.match(text, /Messaggio di test/); assert.match(text, /Date proposte, da confermare insieme/);
});
test('An unconfigured service never causes a network request', async () => {
  let called = false;
  await assert.rejects(submitAvailability('', data, undefined, async () => { called = true; }));
  assert.equal(called, false);
});
test('Submission sends sorted future dates and an explicit payload only when invoked', async () => {
  let request;
  await submitAvailability('https://formspree.io/f/TESTONLY', data, undefined, async (url, options) => {
    request = { url, ...options, payload: JSON.parse(options.body) }; return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });
  assert.equal(request.method, 'POST'); assert.deepEqual(request.payload.dates, ['2099-10-25', '2099-11-02']);
  assert.equal(request.payload.name, "Stefania D'Amore"); assert.equal(request.payload.time_preference, 'Sera'); assert.match(request.payload.availability_summary, /Messaggio di test/); assert.match(request.payload.availability_summary, /25 ottobre 2099/); assert.match(request.payload.availability_summary, /2 novembre 2099/); assert.ok(request.payload.timezone); assert.ok(Date.parse(request.payload.submitted_at));
});
test('A network failure or a non-confirming response can never report receipt', async () => {
  for (const result of [{ status: 422, body: { errors: [{ message: 'Invalid' }] } }, { status: 200, body: { ok: false } }, { status: 200, body: {} }]) {
    await assert.rejects(submitAvailability('https://formspree.io/f/TESTONLY', data, undefined, async () => new Response(JSON.stringify(result.body), { status: result.status })));
  }
  await assert.rejects(submitAvailability('https://formspree.io/f/TESTONLY', data, undefined, async () => { throw new TypeError('Offline'); }));
  assert.equal(data.dates.length, 3); // Failed submission never clears or mutates selections.
});
test('Empty or expired selections are rejected before any request', async () => {
  let calls = 0;
  for (const dates of [[], ['2020-01-01']]) await assert.rejects(submitAvailability('https://formspree.io/f/TESTONLY', { ...data, dates }, undefined, async () => { calls++; }));
  assert.equal(calls, 0);
});
