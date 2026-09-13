import type { Product } from '../../shared/types.js';

export function price(product: Product): number {
  const inStock = product.variants.filter((v) => v.available);
  const pool = inStock.length > 0 ? inStock : product.variants;
  return Math.min(...pool.map((v) => v.unitPrice));
}

export function listPrice(product: Product): number {
  const inStock = product.variants.filter((v) => v.available);
  const pool = inStock.length > 0 ? inStock : product.variants;
  return Math.min(...pool.map((v) => v.compareAtPrice ?? v.unitPrice));
}

export function onSale(product: Product): boolean {
  return product.variants.some((v) => v.compareAtPrice !== null);
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function describeDelta(deltaPct: number): { label: string; tone: string } {
  const rounded = Math.abs(deltaPct).toFixed(1);
  if (rounded === '0.0') return { label: 'at', tone: 'at' };
  return {
    label: `${rounded}% ${deltaPct > 0 ? 'above' : 'below'}`,
    tone: deltaPct > 0 ? 'above' : 'below',
  };
}
