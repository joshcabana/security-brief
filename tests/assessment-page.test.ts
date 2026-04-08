import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import AssessmentPage from '../app/assessment/page';

test('assessment page keeps both the free qualification path and a direct contact fallback', () => {
  const html = renderToStaticMarkup(AssessmentPage());

  assert.match(html, /Best fit/i);
  assert.match(html, /Free path for teams still qualifying the review/i);
  assert.match(html, /Ready to move now\?/i);
  assert.match(html, /hello@aisecuritybrief\.com/i);
});
