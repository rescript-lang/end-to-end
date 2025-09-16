// Sounded fancy right 😉

let changeCwdToRepository = async (repo: string) => {
  let repoExists = await Fs.PromiseAPI.access(#Str(repo))
  ->Promise.thenResolve(_ => true)
  ->Promise.catch(_ => Promise.resolve(false))

  if !repoExists {
    Console.log("Repo does not exist")
    throw(Failure(`Test repository ${repo} does not exist`))
  }

  Process.chdir(Process.process, repo)
}
