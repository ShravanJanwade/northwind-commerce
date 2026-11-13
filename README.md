# Northwind Coffee & Tea

The storefront platform of a small (fictional) coffee and tea shop that sells in
the United States, Canada and France. It is the live example for
[CodeLens](https://github.com/ShravanJanwade/CodeLens): a real repository with real
CI/CD, whose GitHub Actions runs, logs and Azure deployments CodeLens reads and
diagnoses.

The shop is made up. The code, the pipelines, their logs and the three production
regions are real.

## What is in it

| Path | What it does |
| --- | --- |
| `packages/money` | Integer-cent arithmetic, currency conversion, price endings, formatting. Everything else depends on it. |
| `packages/catalog` | Products, categories and stock. |
| `packages/config` | Loads and validates each region's configuration (`config/regions/*.json`). |
| `packages/pricing` | Regional prices, volume and brew-kit discounts, coupon campaigns. |
| `packages/tax` | Sales tax added at checkout (US, Canada) or VAT inside the price (France). |
| `packages/checkout` | Turns a cart into a quote: lines, discounts, shipping, tax, total. |
| `services/api` | Orders API on `node:http` with SQLite (`node:sqlite`) and versioned migrations. |
| `services/storefront` | Renders each region's static storefront: product pages, a JSON catalog, a version stamp. |
| `scripts/smoke.ts` | Checks a deployed region serves the expected release. |

TypeScript runs directly on Node.js 24 (type stripping), so there is no build step
for the code itself; `npm run build` renders the storefronts.

## Pipelines

| Workflow | Runs on | Stages |
| --- | --- | --- |
| [CI](.github/workflows/ci.yml) | every branch except `main` | lint · typecheck · unit tests → integration tests (in-process, then the real server) → build storefronts |
| [Deploy](.github/workflows/deploy.yml) | `main` | lint, typecheck and unit tests → integration tests → staging → production-us, production-ca, production-eu in parallel → verify production |
| [Nightly](.github/workflows/nightly.yml) | 07:17 UTC daily | full test suite on `main`, then a smoke check of every production region |

Deploys sign in to Azure with OpenID Connect: no Azure password or key is stored
in GitHub. Each region builds its own storefront from `config/regions/<region>.json`
before uploading, so a bad value in one region's file stops that region and no
other.

| Environment | Azure region | Hosting |
| --- | --- | --- |
| `staging` | West US 2 | Storage static website |
| `production-us` | West US 2 | Storage static website |
| `production-ca` | Canada Central | Storage static website |
| `production-eu` | France Central | Storage static website |

`.codelens.json` tells CodeLens which Azure region each GitHub environment is in.

## Failures you will find in the history

Teams learn the most from red builds, so this repository keeps them. Some were
reproduced on purpose, the way a chaos drill would, so that every kind of failure
CodeLens classifies has a real example. The runs and logs are untouched GitHub
Actions output.

- **A flaky test.** `issues unique codes for a newsletter-sized campaign` draws
  2,600 five-character codes from a 32-character alphabet and fails when two
  collide, about one run in ten, on any branch. It is left in on purpose.
- Others are listed in [docs/incidents.md](docs/incidents.md) as they happen.

## Run it

Node.js 24 or later.

```sh
npm ci
npm test                 # unit and integration tests
npm run lint
npm run typecheck
npm run build            # storefronts for every region, into dist/
npm run start:api        # orders API on http://localhost:8080
```

## Calling the orders API

```sh
curl 'http://localhost:8080/api/products?region=eu&category=coffee'
curl -X POST http://localhost:8080/api/quote -H 'content-type: application/json' -d '{"region":"us","items":[{"sku":"NW-MUG-001","quantity":3}],"couponCode":"WELCOME10"}'
curl -X POST http://localhost:8080/api/orders -H 'content-type: application/json' -d '{"region":"ca","email":"ada@example.com","items":[{"sku":"NW-COF-002","quantity":2}]}'
```

Prices are integer minor units (cents); every money value carries its currency.

## Deploying your own copy

`deploy/azure-setup.sh` creates the four storage accounts, trusts this
repository's environments for OpenID Connect sign-in and sets the repository
variables the Deploy workflow reads. Run it once in Azure Cloud Shell. Without
those variables the deploy jobs are skipped and everything else still runs.

Static websites have no compute, so the four accounts cost a few cents a month.
GitHub Actions minutes are free for public repositories.
