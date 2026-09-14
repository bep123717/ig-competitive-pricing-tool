import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { fetchAdidasProduct } from './adidas.js';
import { fetchShopifyProduct, ShopifyProduct } from './shopify.js';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const fakeFetch = (body: unknown, status = 200) => {
  globalThis.fetch = async () =>
    ({ ok: status < 400, status, statusText: 'stub', json: async () => body }) as Response;
};

const source = {
  competitor: 'true-classic',
  storeUrl: 'https://www.trueclassictees.com',
  handle: 'white-crew-neck-tee',
  color: 'White',
} as const;

const shopifyTee: ShopifyProduct = {
  title: 'White Classic Crew Neck',
  options: [{ name: 'Size', values: ['S', 'M'] }],
  variants: [
    { price: 3499, compare_at_price: 3499, available: true, option1: 'S', option2: null, option3: null },
    { price: 2800, compare_at_price: 3500, available: false, option1: 'M', option2: null, option3: null },
  ],
};

test('fetchShopifyProduct: maps variants', async () => {
  fakeFetch(shopifyTee);
  const { variants } = await fetchShopifyProduct(source);
  assert.deepEqual(variants, [
    { size: 'S', color: 'White', unitPrice: 3499, compareAtPrice: null, available: true },
    { size: 'M', color: 'White', unitPrice: 2800, compareAtPrice: 3500, available: false },
  ]);
});

test('fetchShopifyProduct: fills in product name and url', async () => {
  fakeFetch(shopifyTee);
  const product = await fetchShopifyProduct(source);
  assert.equal(product.productName, 'White Classic Crew Neck');
  assert.equal(product.url, 'https://www.trueclassictees.com/products/white-crew-neck-tee');
});

test('fetchShopifyProduct: throws on HTTP error', async () => {
  fakeFetch(null, 404);
  await assert.rejects(fetchShopifyProduct(source), /404/);
});

const adidasTee = (currentPrice: number, standard_price: number, is_orderable = true) => [
  {
    name: 'Adapt Tee',
    pricing_information: { currentPrice, standard_price },
    attribute_list: { color: 'White', is_orderable },
    variation_list: [{ size: 'S' }, { size: 'M' }],
  },
];

test('fetchAdidasProduct: dollars to cents, sale price from standard_price', async () => {
  fakeFetch(adidasTee(28, 35));
  const { variants } = await fetchAdidasProduct();
  assert.equal(variants[0].unitPrice, 2800);
  assert.equal(variants[0].compareAtPrice, 3500);
});

test('fetchAdidasProduct: cents are rounded', async () => {
  fakeFetch(adidasTee(34.999, 34.999));
  const { variants } = await fetchAdidasProduct();
  assert.equal(variants[0].unitPrice, 3500);
});

test('fetchAdidasProduct: standard_price equal to current is not a sale', async () => {
  fakeFetch(adidasTee(35, 35));
  const { variants } = await fetchAdidasProduct();
  assert.equal(variants[0].compareAtPrice, null);
});

test('fetchAdidasProduct: product-level is_orderable fans out to every size', async () => {
  fakeFetch(adidasTee(35, 35, false));
  const { variants } = await fetchAdidasProduct();
  assert.deepEqual(variants.map((v) => v.available), [false, false]);
});

test('fetchAdidasProduct: throws on HTTP error and on empty response', async () => {
  fakeFetch(null, 403);
  await assert.rejects(fetchAdidasProduct(), /403/);
  fakeFetch([]);
  await assert.rejects(fetchAdidasProduct(), /No product/);
});
