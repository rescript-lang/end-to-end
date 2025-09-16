// Sounded fancy right 😉

let changeCwdToRepository = async (repo: string, afterChangeCwd: unit => promise<unit>) => {
  let orginalCwd: string = Process.cwd(Process.process)
  let repoExists = await Fs.PromiseAPI.access(#Str(repo))
  ->Promise.thenResolve(_ => true)
  ->Promise.catch(_ => Promise.resolve(false))

  if !repoExists {
    Console.log("Repo does not exist")
    throw(Failure(`Test repository ${repo} does not exist`))
  }

  Process.chdir(Process.process, repo)
  try {
    await afterChangeCwd()
  } catch {
  | _ => {
      Process.chdir(Process.process, orginalCwd)
      throw(Failure("afterChangeCwd failed; restored original CWD"))
    }
  }
}
