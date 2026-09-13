# Competitive Pricing Monitor — Mott & Bow

MVP for tracking competitor t-shirt pricing.

- `scraper/` — collects competitor pricing data, writes JSON to S3
- `shared/` — schema + types shared by scraper and web (single source of truth)
- `web/` — React dashboard (Vite), deployed to S3 static hosting

## Run the scraper

```sh
npm install
npm run scrape
```
