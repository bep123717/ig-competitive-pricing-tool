import { CompetitorAdapter, Product, ProductSchema, Snapshot, SnapshotSchema } from '../shared/types.js';

async function runAdapter(adapter: CompetitorAdapter): Promise<Product[]> {
  const products = ProductSchema.array().parse(await adapter.fetch());
  console.log(`${adapter.competitor}: ${products.length} product(s)`);
  return products;
}

export async function collectSnapshot(adapterList: CompetitorAdapter[]): Promise<Snapshot> {
  const snapshot: Snapshot = {
    fetchedAt: new Date().toISOString(),
    errors: [],
    products: [],
  };

  const results = await Promise.allSettled(adapterList.map(runAdapter));

  results.forEach((result, i) => {
    const { competitor } = adapterList[i];
    if (result.status === 'fulfilled') {
      snapshot.products.push(...result.value);
    } else {
      const message =
        result.reason instanceof Error ? result.reason.message : String(result.reason);
      snapshot.errors.push({ competitor, message });
      console.error(`${competitor}: FAILED — ${message}`);
    }
  });

  return SnapshotSchema.parse(snapshot);
}
