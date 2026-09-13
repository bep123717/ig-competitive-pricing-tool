import { COMPETITORS, Product, Variant } from '../shared/types.js';

const PRODUCT_ID = 'IS3808';
const API_URL = `https://www.adidas.com/api/product-list/${PRODUCT_ID}`;
const PRODUCT_URL = `https://www.adidas.com/us/designed-for-training-workout-tee/${PRODUCT_ID}.html`;

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

type AdidasProduct = {
  name: string;
  pricing_information: { currentPrice: number; standard_price: number };
  attribute_list: { color: string; is_orderable: boolean };
  variation_list: { size: string }[];
};

const toCents = (dollars: number) => Math.round(dollars * 100);

export async function fetchAdidasProduct(): Promise<Product> {
  const response = await fetch(API_URL, {
    headers: { 'User-Agent': BROWSER_USER_AGENT, Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} from ${API_URL}`);
  }

  const [product]: AdidasProduct[] = await response.json();
  if (!product) throw new Error(`No product returned for ${PRODUCT_ID}`);

  const { currentPrice, standard_price } = product.pricing_information;
  const unitPrice = toCents(currentPrice);
  const compareAtPrice = standard_price > currentPrice ? toCents(standard_price) : null;

  const variants: Variant[] = product.variation_list.map(({ size }) => ({
    size,
    color: product.attribute_list.color,
    unitPrice,
    compareAtPrice,
    available: product.attribute_list.is_orderable,
  }));

  return {
    competitor: 'adidas',
    competitorName: COMPETITORS['adidas'].displayName,
    productName: product.name,
    url: PRODUCT_URL,
    currency: 'USD',
    variants,
  };
}
