import { CompetitorAdapter } from '../shared/types.js';
import { fetchAdidasProduct } from './adidas.js';
import { fetchShopifyProduct, ShopifySource } from './shopify.js';

const shopifySources: ShopifySource[] = [
  {
    competitor: 'mott-and-bow',
    storeUrl: 'https://www.mottandbow.com',
    handle: 'scrt-drig-whit-luxury',
  },
  {
    competitor: 'true-classic',
    storeUrl: 'https://www.trueclassictees.com',
    handle: 'white-crew-neck-tee',
    color: 'White',
  },
  {
    competitor: 'nobull',
    storeUrl: 'https://www.nobullproject.com',
    handle: 'mens-adapt-tee-white',
  },
];

export const adapters: CompetitorAdapter[] = [
  ...shopifySources.map((source) => ({
    competitor: source.competitor,
    fetch: async () => [await fetchShopifyProduct(source)],
  })),
  {
    competitor: 'adidas',
    fetch: async () => [await fetchAdidasProduct()],
  },
];
