open RescriptBun.Test

/*

pnpm will install the ReScript compiler into a `node_modules/.pnpm/@rescript+darwin-arm64@12.0.0-beta.11` directory.
This test repository is to ensure that we find the right binaries and runtime (Pervasis).

The original sample is based on https://gist.github.com/hackwaly/bae3945b92170e79b9130bf1b6019209
See https://github.com/rescript-lang/rescript/issues/7526

 */

let repo = Path.resolve([import.meta.dir, "../repos/pnpm/single-project"])

describe("A single ReScript project using npm as package manager", () => {
  let orginalCwd: string = Process.cwd(Process.process)

  beforeAllAsync(async () => {
    await changeCwdToRepository(
      repo,
      async () => {
        let _ = await sh`pnpm install`
        let _ = await sh`pnpm update rescript`
      },
    )
  })

  afterAllAsync(async () => {
    Process.chdir(Process.process, orginalCwd)
  })

  testAsync("should clean", async () => {
    let _ = await sh` npm run clean`
  })

  testAsync("should build", async () => {
    let _ = await sh`pnpm run build`
  })
})
