import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Product } from '../shared/types.js';
import { optionValue, saleCompareAt, ShopifyProduct, ShopifyVariant } from './shopify.js';
import { describeDelta, displayVariant, listPrice, median, onSale, price } from '../web/src/pricing.js';

const variant = (over: Partial<ShopifyVariant>): ShopifyVariant => ({
  price: 3499,
  compare_at_price: null,
  available: true,
  option1: null,
  option2: null,
  option3: null,
  ...over,
});

test('saleCompareAt: null when not on sale', () => {
  assert.equal(saleCompareAt(variant({ compare_at_price: null })), null);
});

test('saleCompareAt: True Classic fakes it — compare_at equal to price is not a sale', () => {
  assert.equal(saleCompareAt(variant({ price: 3499, compare_at_price: 3499 })), null);
});

test('saleCompareAt: compare_at below price is not a sale', () => {
  assert.equal(saleCompareAt(variant({ price: 3499, compare_at_price: 2999 })), null);
});

test('saleCompareAt: real sale passes through', () => {
  assert.equal(saleCompareAt(variant({ price: 2800, compare_at_price: 3500 })), 3500);
});

const shopifyProduct = (options: string[], v: Partial<ShopifyVariant>): ShopifyProduct => ({
  title: 'Test Tee',
  options: options.map((name) => ({ name, values: [] })),
  variants: [variant(v)],
});

test('optionValue: maps option name to position', () => {
  const p = shopifyProduct(['Color', 'Size'], { option1: 'White', option2: 'M' });
  assert.equal(optionValue(p, p.variants[0], 'Size'), 'M');
  assert.equal(optionValue(p, p.variants[0], 'Color'), 'White');
});

test('optionValue: case-insensitive, null when absent (True Classic has no Color)', () => {
  const p = shopifyProduct(['Size'], { option1: 'L' });
  assert.equal(optionValue(p, p.variants[0], 'size'), 'L');
  assert.equal(optionValue(p, p.variants[0], 'Color'), null);
});

test('median: odd count takes middle', () => {
  assert.equal(median([5000, 2800, 3499]), 3499);
});

test('median: even count averages the middle two', () => {
  assert.equal(median([1000, 2000, 3000, 4000]), 2500);
});

test('median: single value', () => {
  assert.equal(median([4200]), 4200);
});

test('median: does not mutate input', () => {
  const input = [3, 1, 2];
  median(input);
  assert.deepEqual(input, [3, 1, 2]);
});

test('describeDelta: above / below / at', () => {
  assert.equal(describeDelta(14.32).label, '14.3% above');
  assert.equal(describeDelta(-5).label, '5.0% below');
  assert.equal(describeDelta(0).label, 'at');
});

test('describeDelta: near-zero rounds to "at" — no "0.0% above" absurdity', () => {
  assert.equal(describeDelta(0.03).label, 'at');
  assert.equal(describeDelta(-0.04).label, 'at');
  assert.equal(describeDelta(0.06).label, '0.1% above');
});

const product = (variants: Product['variants']): Product => ({
  competitor: 'adidas',
  competitorName: 'Adidas',
  productName: 'Test Tee',
  url: 'https://example.com/tee',
  currency: 'USD',
  variants,
});

const pv = (unitPrice: number, available: boolean, compareAtPrice: number | null = null) => ({
  size: 'M',
  color: 'White',
  unitPrice,
  compareAtPrice,
  available,
});

test('price: lowest in-stock variant wins', () => {
  assert.equal(price(product([pv(3999, false), pv(4199, true), pv(4999, true)])), 4199);
});

test('price: falls back to all variants when nothing in stock', () => {
  assert.equal(price(product([pv(3999, false), pv(4999, false)])), 3999);
});

test('listPrice: uses compareAtPrice when on sale, unitPrice otherwise', () => {
  assert.equal(listPrice(product([pv(2800, true, 3500)])), 3500);
  assert.equal(listPrice(product([pv(3499, true)])), 3499);
});

test('displayVariant: price and compareAt come from the SAME variant', () => {
  const cheapNoSale = pv(3499, true);
  const pricierOnSale = pv(4199, true, 4999);
  const chosen = displayVariant(product([pricierOnSale, cheapNoSale]));
  assert.equal(chosen.unitPrice, 3499);
  assert.equal(chosen.compareAtPrice, null);
});

test('onSale: reflects the displayed variant, not just any variant', () => {
  const cheapNoSale = pv(3499, true);
  const pricierOnSale = pv(4199, true, 4999);
  assert.equal(onSale(product([pricierOnSale, cheapNoSale])), false);
  assert.equal(onSale(product([pv(2800, true, 3500)])), true);
});
