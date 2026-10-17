import { cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { compilerPackage } from "./compiler-package.js";

const source = resolve(import.meta.dirname, "../repos/bun/nextjs-rsc");
const artifacts = resolve(import.meta.dirname, "../artifacts/nextjs-rsc");
const compiler = process.env.RESCRIPT_PACKAGE ?? "master";
const baseline = process.env.RESCRIPT_BASELINE?.trim();

class CommandFailure extends Error {
  constructor(args, code, output) {
    super(`${args.join(" ")} exited with ${code}`);
    this.command = args;
    this.output = output;
  }
}

async function command(args, cwd, log) {
  const child = Bun.spawn(args, {
    cwd,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdout: "pipe",
    stderr: "pipe",
  });
  let output = "";
  const drain = async (stream) => {
    const decoder = new TextDecoder();
    for await (const chunk of stream) {
      process.stdout.write(chunk);
      output += decoder.decode(chunk, { stream: true });
    }
  };
  await Promise.all([drain(child.stdout), drain(child.stderr)]);
  const code = await child.exited;
  await Bun.write(log, output);
  if (code !== 0) {
    throw new CommandFailure(args, code, output);
  }
}

async function check(spec, label) {
  const pinned = await compilerPackage(spec);
  const project = await mkdtemp(join(tmpdir(), "rescript-nextjs-rsc-"));
  const logs = join(artifacts, label);
  await rm(logs, { recursive: true, force: true });
  await mkdir(logs, { recursive: true });
  console.log(`\n${label} compiler: ${pinned}`);
  await Bun.write(join(logs, "compiler.txt"), `${pinned}\n`);
  try {
    await cp(source, project, {
      recursive: true,
      filter: (path) =>
        !/(?:^|[/\\])(?:node_modules|lib|\.next|test-results|playwright-report)(?:[/\\]|$)/.test(
          path,
        ) && !path.endsWith(".res.js"),
    });
    const manifest = await Bun.file(join(project, "package.json")).json();
    manifest.devDependencies.rescript = pinned;
    await Bun.write(
      join(project, "package.json"),
      JSON.stringify(manifest, null, 2) + "\n",
    );
    await command(["bun", "install"], project, join(logs, "install.log"));
    await command(
      ["bun", "run", "res:build"],
      project,
      join(logs, "rescript.log"),
    );
    await command(["bun", "run", "build"], project, join(logs, "build.log"));
    await command(
      [
        "bun",
        "x",
        "--no-install",
        "playwright",
        "install",
        ...(process.env.CI ? ["--with-deps"] : []),
        "chromium",
      ],
      project,
      join(logs, "browser-install.log"),
    );
    try {
      await command(["bun", "run", "test"], project, join(logs, "test.log"));
    } finally {
      await cp(join(project, "test-results"), join(logs, "test-results"), {
        recursive: true,
      }).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
  } finally {
    await rm(project, { recursive: true, force: true });
  }
}

await mkdir(artifacts, { recursive: true });
if (baseline) {
  try {
    await check(baseline, "baseline");
    throw new Error(
      "The baseline passed; it no longer reproduces the nested JSX failure.",
    );
  } catch (error) {
    if (
      !(error instanceof CommandFailure) ||
      error.command.join(" ") !== "bun run build" ||
      !/Cannot read properties of undefined \(reading 'make'\)/.test(
        error.output,
      ) ||
      !/src\/Page\.res\.js/.test(error.output)
    ) {
      throw error;
    }
    console.log(
      "\nBaseline reproduced the nested JSX client-boundary failure.",
    );
  }
}
await check(compiler, "candidate");
