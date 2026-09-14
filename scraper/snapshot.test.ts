import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CompetitorAdapter, Product } from '../shared/types.js';
import { collectSnapshot } from './snapshot.js';

const product = (competitor: Product['competitor']): Product => ({
  competitor,
  competitorName: 'Test',
  productName: 'Test Tee',
  url: 'https://example.com/tee',
  currency: 'USD',
  variants: [{ size: 'M', color: 'White', unitPrice: 3499, compareAtPrice: null, available: true }],
});

const adapter = (competitor: Product['competitor'], fetch: CompetitorAdapter['fetch']) => ({
  competitor,
  fetch,
});

test('collectSnapshot: gathers products from all adapters', async () => {
  const snapshot = await collectSnapshot([
    adapter('nobull', async () => [product('nobull')]),
    adapter('adidas', async () => [product('adidas')]),
  ]);
  assert.deepEqual(snapshot.products.map((p) => p.competitor), ['nobull', 'adidas']);
  assert.deepEqual(snapshot.errors, []);
});

test('collectSnapshot: one failing adapter does not take down the rest', async () => {
  const snapshot = await collectSnapshot([
    adapter('nobull', async () => [product('nobull')]),
    adapter('adidas', async () => {
      throw new Error('403 Forbidden');
    }),
  ]);
  assert.deepEqual(snapshot.products.map((p) => p.competitor), ['nobull']);
  assert.deepEqual(snapshot.errors, [{ competitor: 'adidas', message: '403 Forbidden' }]);
});

test('collectSnapshot: adapter output that fails the schema becomes an error', async () => {
  const bad = { ...product('nobull'), url: 'not-a-url' };
  const snapshot = await collectSnapshot([adapter('nobull', async () => [bad])]);
  assert.equal(snapshot.products.length, 0);
  assert.equal(snapshot.errors[0].competitor, 'nobull');
});
