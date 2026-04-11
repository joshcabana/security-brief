import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStatusSnapshot } from '../lib/status-data.mjs';

test('buildStatusSnapshot returns the minimal operational snapshot with the correct shape', () => {
  const snapshot = buildStatusSnapshot();

  assert.equal(snapshot.schema_version, '3');
  assert.equal(snapshot.status, 'operational');
  assert.ok(typeof snapshot.generated_at === 'string');
  assert.ok(typeof snapshot.site.name === 'string');
  assert.ok(typeof snapshot.site.url === 'string');
});

test('buildStatusSnapshot accepts a generatedAt override', () => {
  const fixedAt = '2026-01-01T00:00:00.000Z';
  const snapshot = buildStatusSnapshot({ generatedAt: fixedAt });

  assert.equal(snapshot.generated_at, fixedAt);
  assert.equal(snapshot.schema_version, '3');
  assert.equal(snapshot.status, 'operational');
});

test('buildStatusSnapshot falls back to default site values when env vars are absent', () => {
  const snapshot = buildStatusSnapshot();

  assert.ok(snapshot.site.name.length > 0);
  assert.ok(snapshot.site.url.startsWith('https://'));
});

