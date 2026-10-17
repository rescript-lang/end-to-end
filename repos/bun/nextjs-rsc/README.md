# Nested ReScript components across a Next.js client boundary

This App Router sample renders a ReScript Server Component using nested components
from a `"use client"` file. It covers a two-step module alias, deeper nesting,
`React.memo`, a private component hidden by `.resi`, a submodule with the same name
as its file, and a relative external with a handwritten FFI interface.

The test builds a production Next.js application with Turbopack, checks its HTML,
then uses Chromium to verify hydration and state updates in both ReScript and
external JavaScript components. It uses actual `@rescript/react` bindings.

From the repository root, with Bun and Node.js 22 or newer installed:

```sh
bun run test:nextjs-rsc
```

The default compiler is the latest published master build from pkg.pr.new. To test
a PR or release instead:

```sh
RESCRIPT_PACKAGE=https://pkg.pr.new/rescript-lang/rescript@8886 bun run test:nextjs-rsc
RESCRIPT_PACKAGE=12.3.1 bun run test:nextjs-rsc
```

For a before/after comparison, provide an optional baseline that is expected to
fail at the original nested `.make` access during Next.js prerendering:

```sh
RESCRIPT_BASELINE=https://pkg.pr.new/rescript-lang/rescript@58f1bd223b455d60990dbce94b77720644f98bf9 \
RESCRIPT_PACKAGE=https://pkg.pr.new/rescript-lang/rescript@8886 \
bun run test:nextjs-rsc
```

Install failures, compiler errors and unrelated Next.js errors fail the comparison.
Once master contains the fix, test it normally without an expected-failure baseline.

The runner uses temporary copies, leaving the sample's manifest and lockfile
untouched. Moving pkg.pr.new refs are resolved to immutable commit URLs, recorded
alongside build logs and Playwright results under `artifacts/nextjs-rsc/`. Chromium
is installed automatically; the production server uses port 3237.

The **CI** GitHub workflow exposes the same optional `compiler` and `baseline`
inputs. Providing `compiler` explicitly runs this compatibility check; omitting it
runs the existing package-manager smoke tests. Framework tests do not run on a schedule.

Compiler implementation: https://github.com/rescript-lang/rescript/pull/8886
Original PoC: https://github.com/rescript-lang/rescript/pull/8293
