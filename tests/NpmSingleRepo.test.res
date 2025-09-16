let repo = Path.resolve([import.meta.dir, "../repos/npm/single-project"])

open RescriptBun.Test

describe("A single ReScript project using npm as package manager", () => {
  let orginalCwd: string = Process.cwd(Process.process)

  beforeAllAsync(async () => {
    Process.chdir(Process.process, repo)
    let _ = await sh`npm install`
    switch Process.process.env {
    | dict{"CI": "true"} => Console.log("This test is running in CI")
    | _ => ()
    }
  })

  afterAllAsync(async () => {
    Process.chdir(Process.process, orginalCwd)
  })

  testAsync("should always pass", async () => {
    Console.log(repo)
  })

  testAsync("should clean", async () => {
    let _ = await sh`npx rescript clean`
  })

  testAsync("should build", async () => {
    let _ = await sh`npx rescript build`
  })
})
