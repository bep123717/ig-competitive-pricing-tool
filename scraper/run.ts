import { writeFile } from 'node:fs/promises';
import { adapters } from './adapters.js';
import { collectSnapshot } from './snapshot.js';

async function main() {
  const snapshot = await collectSnapshot(adapters);
  await writeFile('data.json', JSON.stringify(snapshot, null, 2));
  console.log(`Wrote data.json (${snapshot.products.length} products, ${snapshot.errors.length} errors)`);
}

main();
