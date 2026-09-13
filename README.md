# Competitive Pricing Monitor — Mott & Bow

MVP for tracking competitor t-shirt pricing against Mott & Bow prices. Scrapes specified competitor pricing for men's white crew-neck tee, publishes a normalized snapshot to S3, and serves a basic dashboard configured to answer the question:
**"Are we priced competitively?"**

**Live dashboard:** http://ig-bpollard-take-home-fe-bucket.s3-website-us-east-1.amazonaws.com
**Data:** https://ig-bpollard-take-home.intelligems.io/data.json

## Architecture

- `scraper/` — 4 adapters + concurrent runner; collects competitor pricing data with validation, writes JSON to S3
- `shared/types.ts` — Single source of truth schema and types- shared by scraper and web app
- `web/` — Vite & React dashboard, reads data.json from the CDN

- **One adapter per competitor** with a shared interface. Shopify stores share one fetch/normalize helper, non-Shopify has bespoke adapter. Adapter validation and output designed to return any errors without blocking successful data fetches.
- **Snapshots** are written to `snapshots/<timestamp>.json` to allow for future price-history features.

## Running

Requires Node ≥ 18 (native fetch).

    npm install
    npm run scrape      # writes data.json locally (no AWS needed)
    npm test            # normalization tests
    npm run upload      # pushes data.json + snapshot to S3 (AWS creds required)
    cd web && npm install && npm run dev   # dashboard against live CDN data

## Notable findings & decisions
- Vite for frontend. Deliverable is static files on S3 — Vite is the zero-config standard for building React SPA to static output. 
- Provided API token for No Bull returned UNAUTHORIZED; decision: fell back to the stores public product endpoint to collect data
- Differences in data models
  - Sale is represented differently for some stores- True Classic returns `compare_at_price == price` when not on sale; others return null/empty; decision: the normalizer treats compare-at ≤ price as "not on sale"
  - Color is represented differently some stores- True Classic shows color in product title; decision: color is config-declared per source
  - Prices returned differently for some stores- Adidas prices in dollars, others in cents; decision: schema stores all money in cents, adapters own the conversion
- Frontend Hero metric shows median, with the goal of demonstrating market rather than outliers. Promo-adjusted comparison renders only when promos materially move the median.

## Deliberately cut (6 hour scope)
- Price history UI. Snapshots accumulating, price history UI would be natural next feature.
- Product matching. This project compares one tee per competitor. Building system for categorizing and matching many comparable products out of scope for this project.
- Scheduling. Scraping runs are manual, could be scheduled via EventBridge or Actions cron job.
- AWS lifecycle optimizations. Cleanup of old snapshots, stale FE assets.