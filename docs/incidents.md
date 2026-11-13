# Incidents

Pipeline failures worth keeping, newest first: what broke, why, and how it was
fixed. Some were reproduced on purpose, like a chaos drill, so that every kind of
failure CodeLens classifies has a real example; the rest were not planned. Either
way, the runs and logs are untouched GitHub Actions output.

CodeLens reads the same runs and has to reach its verdict from the logs, the
diffs and the run history alone. Each incident says what it concluded on
2026-11-13, misses included. The CodeLens link shows its current reading.

| Run | What happened | CodeLens verdict | Right? |
| --- | --- | --- | --- |
| [Deploy #7][d7] | EU deploy settings missing a key | Config drift, 90% | Yes |
| [Deploy #5][d5] | Azure refused the deploy's sign-in | Secret expiry, 53% | Yes |
| [CI #18][c18] | Syntax error in a test file | Code regression, 46% | Yes |
| [CI #8][c8] | Migration adds a column that exists | Migration failure, 52% | Yes |
| [CI #7][c7] | New volume tier broke the old one | Code regression, 92% | Yes |
| [CI #6][c6] | Tests wait for the API on the wrong port | Timeout, 48% | Yes |
| [CI #5][c5] | npm can't install the Airbnb rules | Dependency drift, 61% | Yes |
| [Deploy #4][d4], [CI #10][c10], [Deploy #1][d1] | Flaky coupon test | Code regression or dependency drift | No |

Seven of ten failed runs read correctly. The three misses are the flaky test,
before it had failed often enough for CodeLens to know it was flaky.

## Deploy #7: production-eu is missing a deploy setting

2026-11-13 16:56 UTC · reproduced on purpose

- **Run:** [Deploy #7][d7] on `main` at [275dfa0][275dfa0] · [in CodeLens][cl-d7]
- **What broke:** `deploy-eu` stopped at "Read deploy settings" with
  `ConfigurationError: production-eu is missing deploy setting "catalogCacheSeconds"`.
  Staging, production-us and production-ca shipped the same build.
- **Why:** 275dfa0 gave the JSON catalog its own cache lifetime, a new required
  setting, and added it to every file in `config/deploy/` except
  `production-eu.json`.
- **Fix:** [ae26fc9][ae26fc9] adds the setting. [Deploy #8][d8] reached all three
  regions.
- **CodeLens:** Config drift, 90%. The key is set for the regions that worked and
  missing for the one that failed, and the same build succeeded in West US 2 and
  Canada Central. So it says to fix production-eu's configuration and re-run that
  deploy, and not to revert the build.

## Deploy #5: Azure refused the deploy's sign-in

2026-11-13 16:37 UTC · not planned

- **Run:** [Deploy #5][d5] on `main` at [0ed711c][0ed711c], the first deploy after
  the Azure setup · [in CodeLens][cl-d5]
- **What broke:** `deploy-staging` could not sign in to Azure:
  `AADSTS700213: No matching federated identity record found for presented assertion subject 'repo:ShravanJanwade@72211611/northwind-commerce@1456195707:environment:staging'`.
- **Why:** GitHub's sign-in tokens name newer repositories by owner and repository
  ID (`owner@id/name@id`). The setup script trusted only the older `owner/name`
  form.
- **Fix:** [d247b17][d247b17] makes `deploy/azure-setup.sh` trust both forms. After
  it was run again, [Deploy #6][d6] reached every region.
- **CodeLens:** Secret expiry, 53%. It quotes the refused subject and says to add a
  federated credential for exactly that subject, with no code change. That is the
  fix. Nothing had expired, but secret expiry is the category CodeLens uses for
  refused credentials.

## CI #18: syntax error in a test file

2026-11-13 06:11 UTC · not planned

- **Run:** [CI #18][c18] on `feature/free-shipping-nudge` at [52939c7][52939c7] ·
  [in CodeLens][cl-c18]
- **What broke:** lint, typecheck and the unit tests all failed to parse
  `packages/checkout/test/quote.test.ts` (`error TS1005: ',' expected` on line 82).
  The flaky coupon test also happened to fail in this run.
- **Why:** an apostrophe in a single-quoted test name ended the string early.
- **Fix:** [9ce876a][9ce876a] fixes the quoting. [CI #19][c19] passed.
- **CodeLens:** Code regression, 46%. The previous run on the branch was green, so
  it blames 52939c7 and says to fix forward.

## CI #8: a migration adds a column that already exists

2026-11-13 05:43 UTC · reproduced on purpose

- **Run:** [CI #8][c8] on `feature/gift-messages` at [2801129][2801129] ·
  [in CodeLens][cl-c8]
- **What broke:** the integration tests, with
  `MigrationError: Migration 0004_add_delivery_notes.sql failed: duplicate column name: gift_message`.
- **Why:** migration 0004 was started from a copy of 0003 and still added 0003's
  `gift_message` column.
- **Fix:** [79088a5][79088a5] drops the copied line. [CI #9][c9] passed.
- **CodeLens:** Migration failure, 52%, pointing at the migration file. It warns to
  check whether the migration applied partly before retrying it.

## CI #7: the new volume tier broke the old one

2026-11-13 05:43 UTC · reproduced on purpose

- **Run:** [CI #7][c7] on `feature/volume-tiers` at [13013c5][13013c5] ·
  [in CodeLens][cl-c7]
- **What broke:** four unit tests and one integration test, for example
  `expected '10% off 6 × NW-MUG-001' to be '15% off 6 × NW-MUG-001'`.
- **Why:** when 13013c5 added the 15% tier for six or more, the tier lookup used
  `quantity > tier.minQuantity`. A line had to exceed a threshold rather than meet
  it, so exactly three items lost their 10% and exactly six got 10% instead of 15%.
- **Fix:** [10815f9][10815f9] compares with `>=`. [CI #11][c11] passed.
- **CodeLens:** Code regression, 92%, blaming 13013c5. All five tests were failing
  for the first time, next to the code the commit changed, on a branch that was
  green before it. Fix forward: nothing has shipped.

## CI #6: integration tests wait for the API on the wrong port

2026-11-13 05:43 UTC · reproduced on purpose

- **Run:** [CI #6][c6] on `chore/api-port` at [daba18a][daba18a] · [in CodeLens][cl-c6]
- **What broke:** the integration job was cancelled after
  `The job has exceeded the maximum execution time of 6m0s`.
- **Why:** daba18a made the API read its port from `API_PORT` instead of `PORT`.
  CI still started it with `PORT=3000`, so it listened on the default 8080 while
  the workflow polled port 3000 until the job's time limit.
- **Fix:** [d5b7d30][d5b7d30] starts the API with `API_PORT=3000`. [CI #12][c12]
  passed.
- **CodeLens:** Timeout, 48%. It says to find what the stage was waiting on before
  raising the limit, which here was an API on another port.

## CI #5: npm can't install the Airbnb rules

2026-11-13 05:43 UTC · reproduced on purpose

- **Run:** [CI #5][c5] on `chore/airbnb-lint` at [3b27762][3b27762] · [in CodeLens][cl-c5]
- **What broke:** `npm ci` failed in every job with `ERESOLVE could not resolve`:
  `eslint-config-airbnb-base@15.0.0` needs `eslint@"^7.32.0 || ^8.2.0"`, and the
  repository is on ESLint 10.
- **Why:** 3b27762 added the Airbnb base rules without checking which ESLint
  versions they support.
- **Fix:** [2567e10][2567e10] reverts them.
- **CodeLens:** Dependency drift, 61%, blaming the lockfile change in 3b27762: go
  back to the last dependency set that installed, then upgrade on purpose.

## Flaky test: `issues unique codes for a newsletter-sized campaign`

Since 2026-11-13 · left in on purpose

- **Runs:** [Deploy #1][d1] and [Deploy #4][d4] on `main`, [CI #10][c10] on
  `chore/airbnb-lint`, and [CI #18][c18] on `feature/free-shipping-nudge`: 4 of
  the first 28 runs.
- **What broke:** `AssertionError: expected 2599 to be 2600`. One code was issued
  twice.
- **Why:** `createCampaign` draws 2,600 random five-character codes from a
  32-character alphabet (about 33.5 million possibilities) and never checks for
  repeats. By the birthday problem, two of them match in about one run in ten. The
  test is right: a repeated code would be shared by two customers.
- **Fix:** none, so that CodeLens has a real flaky test to follow. The fix would be
  for `createCampaign` to redraw any code it has already issued.
- **CodeLens:** missed in the first three. CodeLens calls a test flaky only once it
  has failed on three branches across at least eight runs, and these were its
  first, second and third failures, on two branches. Without that history it read
  them as other causes. [Deploy #1][d1], the first failure, reads as a regression,
  which is fair for a test that had never failed, but it recommends reverting the
  repository's first commit. [CI #10][c10] reads as a dependency change, because
  its commit changed `package-lock.json`. For [Deploy #4][d4] it recommends
  reverting 0ed711c, a commit that changed nothing but `.codelens.json`. The fourth
  failure, in CI #18, came with a real syntax error of its own. The test has now
  failed on three branches in 28 runs, so CodeLens should call its next failure a
  known flake.

[d1]: https://github.com/ShravanJanwade/northwind-commerce/actions/runs/43372893989
[d4]: https://github.com/ShravanJanwade/northwind-commerce/actions/runs/43375056515
[d5]: https://github.com/ShravanJanwade/northwind-commerce/actions/runs/43464603246
[d6]: https://github.com/ShravanJanwade/northwind-commerce/actions/runs/43467142228
[d7]: https://github.com/ShravanJanwade/northwind-commerce/actions/runs/43467678047
[d8]: https://github.com/ShravanJanwade/northwind-commerce/actions/runs/43468162102
[c5]: https://github.com/ShravanJanwade/northwind-commerce/actions/runs/43373915123
[c6]: https://github.com/ShravanJanwade/northwind-commerce/actions/runs/43373915152
[c7]: https://github.com/ShravanJanwade/northwind-commerce/actions/runs/43373915431
[c8]: https://github.com/ShravanJanwade/northwind-commerce/actions/runs/43373916214
[c9]: https://github.com/ShravanJanwade/northwind-commerce/actions/runs/43374264449
[c10]: https://github.com/ShravanJanwade/northwind-commerce/actions/runs/43374265286
[c11]: https://github.com/ShravanJanwade/northwind-commerce/actions/runs/43374265739
[c12]: https://github.com/ShravanJanwade/northwind-commerce/actions/runs/43374732176
[c18]: https://github.com/ShravanJanwade/northwind-commerce/actions/runs/43376946481
[c19]: https://github.com/ShravanJanwade/northwind-commerce/actions/runs/43377034720
[cl-d5]: https://codelens.icygrass-95174406.westus2.azurecontainerapps.io/r/live-northwind-commerce/runs/43464603246
[cl-d7]: https://codelens.icygrass-95174406.westus2.azurecontainerapps.io/r/live-northwind-commerce/runs/43467678047
[cl-c5]: https://codelens.icygrass-95174406.westus2.azurecontainerapps.io/r/live-northwind-commerce/runs/43373915123
[cl-c6]: https://codelens.icygrass-95174406.westus2.azurecontainerapps.io/r/live-northwind-commerce/runs/43373915152
[cl-c7]: https://codelens.icygrass-95174406.westus2.azurecontainerapps.io/r/live-northwind-commerce/runs/43373915431
[cl-c8]: https://codelens.icygrass-95174406.westus2.azurecontainerapps.io/r/live-northwind-commerce/runs/43373916214
[cl-c18]: https://codelens.icygrass-95174406.westus2.azurecontainerapps.io/r/live-northwind-commerce/runs/43376946481
[275dfa0]: https://github.com/ShravanJanwade/northwind-commerce/commit/275dfa0
[ae26fc9]: https://github.com/ShravanJanwade/northwind-commerce/commit/ae26fc9
[0ed711c]: https://github.com/ShravanJanwade/northwind-commerce/commit/0ed711c
[d247b17]: https://github.com/ShravanJanwade/northwind-commerce/commit/d247b17
[52939c7]: https://github.com/ShravanJanwade/northwind-commerce/commit/52939c7
[9ce876a]: https://github.com/ShravanJanwade/northwind-commerce/commit/9ce876a
[2801129]: https://github.com/ShravanJanwade/northwind-commerce/commit/2801129
[79088a5]: https://github.com/ShravanJanwade/northwind-commerce/commit/79088a5
[13013c5]: https://github.com/ShravanJanwade/northwind-commerce/commit/13013c5
[10815f9]: https://github.com/ShravanJanwade/northwind-commerce/commit/10815f9
[daba18a]: https://github.com/ShravanJanwade/northwind-commerce/commit/daba18a
[d5b7d30]: https://github.com/ShravanJanwade/northwind-commerce/commit/d5b7d30
[3b27762]: https://github.com/ShravanJanwade/northwind-commerce/commit/3b27762
[2567e10]: https://github.com/ShravanJanwade/northwind-commerce/commit/2567e10
