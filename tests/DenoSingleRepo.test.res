open RescriptBun.Test

/*

deno will install the ReScript compiler into a `node_modules/.deno/@rescript+darwin-arm64@12.0.0-beta.12` directory.
A direct dependency will be installed into `node_modules/@rescript/webapi`.
And the runtime (Pervasis) will be installed into `node_modules/.deno/@rescript+runtime@12.0.0-beta.12`.

If a package has a namespace (like `@rescript/webapi` has `WebAPI`) it needs to have the `-runtime` argument when creating the `.mlmap` file.
Because deno installs all these packages in different directories, we need to ensure this still works.

The original sample is based on https://github.com/jderochervlk/rescript-12-beta-deno
See https://github.com/rescript-lang/rescript/issues/7828

 */

let repo = Path.resolve([import.meta.dir, "../repos/deno/single-project"])

describe("A single ReScript project using deno as package manager", () => {
  let orginalCwd: string = Process.cwd(Process.process)

  beforeAllAsync(async () => {
    await changeCwdToRepository(
      repo,
      async () => {
        let _ = await sh`deno install`
      },
    )
  })

  afterAllAsync(async () => {
    Process.chdir(Process.process, orginalCwd)
  })

  testAsync("should clean", async () => {
    let _ = await sh`deno task clean`
  })

  testAsync("should build", async () => {
    let _ = await sh`deno task build`
  })
})
