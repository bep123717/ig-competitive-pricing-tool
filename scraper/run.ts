import { writeFile } from 'node:fs/promises';
import { Product, ProductSchema, Snapshot, SnapshotSchema } from '../shared/types.js';
import { adapters } from './adapters.js';

async function runAdapter(adapter: (typeof adapters)[number]): Promise<Product[]> {
  const products = ProductSchema.array().parse(await adapter.fetch());
  console.log(`${adapter.competitor}: ${products.length} product(s)`);
  return products;
}

async function main() {
  const snapshot: Snapshot = {
    fetchedAt: new Date().toISOString(),
    errors: [],
    products: [],
  };

  const results = await Promise.allSettled(adapters.map(runAdapter));

  results.forEach((result, i) => {
    const { competitor } = adapters[i];
    if (result.status === 'fulfilled') {
      snapshot.products.push(...result.value);
    } else {
      const message =
        result.reason instanceof Error ? result.reason.message : String(result.reason);
      snapshot.errors.push({ competitor, message });
      console.error(`${competitor}: FAILED — ${message}`);
    }
  });

  SnapshotSchema.parse(snapshot);
  await writeFile('data.json', JSON.stringify(snapshot, null, 2));
  console.log(`Wrote data.json (${snapshot.products.length} products, ${snapshot.errors.length} errors)`);
}

main();
