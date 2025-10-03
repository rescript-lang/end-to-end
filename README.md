# ReScript end-to-end

## What this repo is

This repo is a cozy landing spot for real‑world ReScript setups. We collect small samples and run them end‑to‑end so we can catch regressions early and, more importantly, help you when something goes sideways.

- **Target audience**: ReScript users who ran into a setup problem and went the extra mile to share a repro. Thank you. Truly.
- **Goal**: We keep the barrier low so you can share details easily, and we’ll do our best to fix the problem!

## Prerequisites

- Bun (we use it to build and run the tests here)
- Whatever your sample naturally uses (npm, pnpm, Deno, …) if you want to run that specific sample locally

No pressure: we don’t expect anyone to run all samples locally.

## Quick start

Run the repository’s test suite (we compile tests first, then run them with Bun):

```bash
bun i
bun run test
```

Notes:
- `pretest` runs `rescript build` for you.
- Some tests call `npm`, `pnpm`, or `deno` under the hood (see `tests/NpmSingleRepo.test.res`, `tests/DenoSingleRepo.test.res`). It’s totally fine if you don’t have all of them installed.

## Repository structure

- `repos/` contains minimal sample projects:
  - `repos/npm/single-project`
  - `repos/pnpm/monorepo`
  - `repos/deno/single-project`
- `tests/` contains Bun-powered tests that run each sample’s install/clean/build commands.

## Contributing a sample

We’re grateful for any repro you can share. Open a PR with our template and tell us:
- What your new folder under `repos/` is about.
- Your package manager and the commands you run (install / clean / build)
- ReScript version(s)
- Your OS (Windows, macOS, Ubuntu)
- What you expected vs. what actually happened
- A link to the upstream compiler issue (see below)

If wiring up tests feels like too much today, that’s okay—we’ll try to help. And if you can prep a bit more, it helps us help you faster.

## Where to report issues

Please don’t open issues here. File them in the main compiler repo instead: [rescript-lang/rescript](https://github.com/rescript-lang/rescript). We use this repo to host samples and run them.

For background on ReScript itself, see the project README and docs linked from the repo above.

Thanks again for helping make ReScript better: you rock!
