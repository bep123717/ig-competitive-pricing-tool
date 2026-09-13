import { useEffect, useState } from 'react';
import type { Product, Snapshot } from '../../shared/types';
import './App.css';

const DATA_URL = 'https://ig-bpollard-take-home.intelligems.io/data.json';
const US = 'mott-and-bow';

const dollars = (cents: number) =>
  (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

function price(product: Product): number {
  const inStock = product.variants.filter((v) => v.available);
  const pool = inStock.length > 0 ? inStock : product.variants;
  return Math.min(...pool.map((v) => v.unitPrice));
}

function listPrice(product: Product): number {
  const inStock = product.variants.filter((v) => v.available);
  const pool = inStock.length > 0 ? inStock : product.variants;
  return Math.min(...pool.map((v) => v.compareAtPrice ?? v.unitPrice));
}

function onSale(product: Product): boolean {
  return product.variants.some((v) => v.compareAtPrice !== null);
}

function describeDelta(deltaPct: number): { label: string; tone: string } {
  const rounded = Math.abs(deltaPct).toFixed(1);
  if (rounded === '0.0') return { label: 'at', tone: 'at' };
  return {
    label: `${rounded}% ${deltaPct > 0 ? 'above' : 'below'}`,
    tone: deltaPct > 0 ? 'above' : 'below',
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function Verdict({ snapshot }: { snapshot: Snapshot }) {
  const us = snapshot.products.find((p) => p.competitor === US);
  const rivals = snapshot.products.filter((p) => p.competitor !== US);
  if (!us || rivals.length === 0) return null;

  const ourPrice = price(us);
  const currentMedian = median(rivals.map(price));
  const listMedian = median(rivals.map(listPrice));
  const currentDeltaPct = ((ourPrice - currentMedian) / currentMedian) * 100;
  const listDeltaPct = ((ourPrice - listMedian) / listMedian) * 100;
  const promosMoveMarket = Math.abs(currentDeltaPct - listDeltaPct) >= 0.5;
  const current = describeDelta(currentDeltaPct);
  const list = describeDelta(listDeltaPct);

  return (
    <section className="verdict">
      <h1>
        Mott & Bow is currently{' '}
        <span className={current.tone}>{current.label}</span> the competitor median
      </h1>
      <p>
        {us.productName} at {dollars(ourPrice)} vs. median {dollars(currentMedian)} across{' '}
        {rivals.length} competitors
      </p>
      {promosMoveMarket && (
        <p className="promo-note">
          Excluding active promos, Mott & Bow is {list.label} the list-price median (
          {dollars(listMedian)})
        </p>
      )}
      <p className="caveat">Based on each competitor's closest white crew-neck tee</p>
    </section>
  );
}

function PriceChart({ products }: { products: Product[] }) {
  const max = Math.max(...products.map(price));
  const ranked = [...products].sort((a, b) => price(a) - price(b));

  return (
    <section className="chart">
      {ranked.map((p) => (
        <div key={p.competitor} className="bar-row">
          <span className="bar-label">
            {p.competitorName}
            {p.competitor === US && <em> (us)</em>}
          </span>
          <div className="bar-track">
            <div
              className={`bar ${p.competitor === US ? 'bar-us' : ''}`}
              style={{ width: `${(price(p) / max) * 100}%` }}
            >
              {dollars(price(p))}
              {onSale(p) && <span className="sale-badge">SALE</span>}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function DetailTable({ products }: { products: Product[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Competitor</th>
          <th>Product</th>
          <th>Price</th>
          <th>Was</th>
          <th>Sizes in stock</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => {
          const compareAt = p.variants.find((v) => v.compareAtPrice !== null)?.compareAtPrice;
          const inStock = p.variants.filter((v) => v.available);
          return (
            <tr key={p.competitor} className={p.competitor === US ? 'row-us' : ''}>
              <td>{p.competitorName}</td>
              <td>
                <a href={p.url} target="_blank" rel="noreferrer">
                  {p.productName}
                </a>
              </td>
              <td>{dollars(price(p))}</td>
              <td>{compareAt ? dollars(compareAt) : '—'}</td>
              <td>
                {inStock.length}/{p.variants.length} ({inStock.map((v) => v.size).join(', ')})
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function App() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(DATA_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setSnapshot)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <main className="status">Failed to load pricing data: {error}</main>;
  if (!snapshot) return <main className="status">Loading pricing data…</main>;

  return (
    <main>
      <header className="page-title">Mott &amp; Bow Competitive Pricing Monitor</header>
      <Verdict snapshot={snapshot} />
      <PriceChart products={snapshot.products} />
      <DetailTable products={snapshot.products} />
      {snapshot.errors.length > 0 && (
        <p className="data-warning">
          Data unavailable for: {snapshot.errors.map((e) => e.competitor).join(', ')}
        </p>
      )}
      <footer>
        Men's white crew-neck tee · lowest in-stock price per competitor · fetched{' '}
        {new Date(snapshot.fetchedAt).toLocaleString()}
      </footer>
    </main>
  );
}
