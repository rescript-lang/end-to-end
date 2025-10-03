open RescriptBun.Test

/*



 */

let repo = Path.resolve([import.meta.dir, "../repos/pnpm/monorepo"])

describe("A monorepo ReScript project using pnpm as package manager", () => {
  let orginalCwd: string = Process.cwd(Process.process)

  beforeAllAsync(async () => {
    await changeCwdToRepository(
      repo,
      async () => {
        let _ = await sh`pnpm install`
      },
    )
  })

  afterAllAsync(async () => {
    Process.chdir(Process.process, orginalCwd)
  })

  testAsync("should clean", async () => {
    let _ = await sh`pnpm run clean`
  })

  testAsync("should build", async () => {
    let _ = await sh`pnpm run build`
  })

  testAsync("should clean/build individual project", async () => {
    let packageAPath = Path.resolve([repo, "packages", "a"])
    let _ = await (sh`npx rescript clean`)->ShellPromise.cwd(packageAPath)
    let _ = await (sh`npx rescript build`)->ShellPromise.cwd(packageAPath)
  })
})
