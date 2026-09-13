import { CompetitorId, COMPETITORS, Product, Variant } from '../shared/types.js';

export type ShopifyVariant = {
  price: number;
  compare_at_price: number | null;
  available: boolean;
  option1: string | null;
  option2: string | null;
  option3: string | null;
};

export type ShopifyProduct = {
  title: string;
  options: { name: string; values: string[] }[];
  variants: ShopifyVariant[];
};

export type ShopifySource = {
  competitor: CompetitorId;
  storeUrl: string;
  handle: string;
  color?: string;
};

export function optionValue(
  product: ShopifyProduct,
  variant: ShopifyVariant,
  name: string,
): string | null {
  const index = product.options.findIndex(
    (o) => o.name.toLowerCase() === name.toLowerCase(),
  );
  if (index === -1) return null;
  return [variant.option1, variant.option2, variant.option3][index];
}

export function saleCompareAt(variant: ShopifyVariant): number | null {
  const { compare_at_price, price } = variant;
  if (compare_at_price === null || compare_at_price <= price) return null;
  return compare_at_price;
}

export async function fetchShopifyProduct(source: ShopifySource): Promise<Product> {
  const url = `${source.storeUrl}/products/${source.handle}`;
  const response = await fetch(`${url}.js`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} from ${url}.js`);
  }

  const product: ShopifyProduct = await response.json();

  const variants: Variant[] = product.variants.map((variant) => ({
    size: optionValue(product, variant, 'Size') ?? 'One Size',
    color: optionValue(product, variant, 'Color') ?? source.color ?? 'Not Listed',
    unitPrice: variant.price,
    compareAtPrice: saleCompareAt(variant),
    available: variant.available,
  }));

  return {
    competitor: source.competitor,
    competitorName: COMPETITORS[source.competitor].displayName,
    productName: product.title,
    url,
    currency: 'USD',
    variants,
  };
}
