import assert from 'node:assert/strict';
import test from 'node:test';
import { GET } from '../app/status.json/route';

test('status.json route returns the public status snapshot with no-store caching', async () => {
  const response = await GET();
  const payload = (await response.json()) as {
    schema_version: string;
    status: string;
    generated_at: string;
    site: {
      name: string;
      url: string;
    };
  };

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(payload.schema_version, '3');
  assert.equal(payload.status, 'operational');
  assert.ok(typeof payload.generated_at === 'string');
  assert.ok(typeof payload.site.name === 'string');
  assert.ok(typeof payload.site.url === 'string');
  assert.equal('status_document' in payload, false);
  assert.equal('runtime' in payload, false);
});
