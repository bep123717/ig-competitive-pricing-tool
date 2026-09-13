import { z } from 'zod';

export const COMPETITOR_IDS = ['mott-and-bow', 'true-classic', 'nobull', 'adidas'] as const;

export const CompetitorIdSchema = z.enum(COMPETITOR_IDS);
export type CompetitorId = z.infer<typeof CompetitorIdSchema>;

export const COMPETITORS: Record<CompetitorId, { displayName: string }> = {
  'mott-and-bow': { displayName: 'Mott & Bow' },
  'true-classic': { displayName: 'True Classic' },
  'nobull': { displayName: 'NOBULL' },
  'adidas': { displayName: 'Adidas' },
};

const cents = z.number().int().nonnegative();

export const VariantSchema = z.object({
  size: z.string(),
  color: z.string(),
  unitPrice: cents,
  compareAtPrice: cents.nullable(),
  available: z.boolean(),
});

export const ProductSchema = z.object({
  competitor: CompetitorIdSchema,
  competitorName: z.string(),
  productName: z.string(),
  url: z.string().url(),
  currency: z.string(),
  variants: z.array(VariantSchema),
});

export const SnapshotSchema = z.object({
  fetchedAt: z.string().datetime(),
  errors: z.array(
    z.object({
      competitor: CompetitorIdSchema,
      message: z.string(),
    }),
  ),
  products: z.array(ProductSchema),
});

export type Variant = z.infer<typeof VariantSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Snapshot = z.infer<typeof SnapshotSchema>;

export interface CompetitorAdapter {
  competitor: CompetitorId;
  fetch(): Promise<Product[]>;
}
