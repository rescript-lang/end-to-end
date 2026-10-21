import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve } from "node:path";
import { compilerPackage } from "./compiler-package.js";

const source = resolve(import.meta.dirname, "../repos/bun/nextjs-rsc");
const artifacts = resolve(import.meta.dirname, "../artifacts/nextjs-rsc");
const compiler = process.env.RESCRIPT_PACKAGE ?? "master";
const baseline = process.env.RESCRIPT_BASELINE?.trim();
const entries = {
  nested: "Page",
  incremental: "Page",
  awaited: "AwaitedPage",
  reexport: "ReexportPage",
};
const scenario = process.env.RESCRIPT_SCENARIO ?? "all";
if (scenario !== "all" && !Object.hasOwn(entries, scenario)) {
  throw new Error(`Unknown Next.js RSC scenario: ${scenario}`);
}
const scenarios = scenario === "all" ? Object.keys(entries) : [scenario];

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

async function incrementalRebuild(project, logs) {
  const lib = join(project, "lib");
  const interfaces = (await readdir(lib, { recursive: true })).filter(
    (file) => basename(file) === "Sidebar.cmi",
  );
  assert(interfaces.length > 0, "Missing Sidebar.cmi");
  const files = {
    ...Object.fromEntries(
      interfaces.sort().map((file) => [`interface:${file}`, join(lib, file)]),
    ),
    consumer: join(project, "src/Page.res.js"),
    producer: join(project, "src/Sidebar.res.js"),
  };
  const snapshot = async (phase) => {
    const hashes = {};
    for (const [name, file] of Object.entries(files)) {
      const content = await readFile(file);
      hashes[name] = createHash("sha256").update(content).digest("hex");
      if (!name.startsWith("interface:")) {
        await Bun.write(join(logs, `${phase}-${basename(file)}`), content);
      }
    }
    return hashes;
  };
  const before = await snapshot("before");
  const source = join(project, "src/Sidebar.res");
  const marker =
    "// Incremental test: rebind this component without changing its interface.";
  const original = await Bun.file(source).text();
  assert.equal(
    original.split(marker).length,
    2,
    "Missing unique rebuild marker",
  );
  await Bun.write(
    source,
    original.replace(marker, "let make = React.memo(make)"),
  );
  await command(
    ["bun", "run", "res:build"],
    project,
    join(logs, "rescript-rebuild.log"),
  );
  const after = await snapshot("after");
  await Bun.write(
    join(logs, "incremental.json"),
    JSON.stringify(
      {
        files: Object.fromEntries(
          Object.entries(files).map(([name, file]) => [
            name,
            relative(project, file),
          ]),
        ),
        before,
        after,
      },
      null,
      2,
    ) + "\n",
  );
  for (const name of Object.keys(files).filter((name) =>
    name.startsWith("interface:"),
  )) {
    assert.equal(after[name], before[name], `${files[name]} changed`);
  }
  assert.equal(
    after.consumer,
    before.consumer,
    "The compiled consumer changed",
  );
  assert.notEqual(
    after.producer,
    before.producer,
    "The producer was not rebuilt",
  );
}

async function check(pinned, label, scenario) {
  const project = await mkdtemp(join(tmpdir(), "rescript-nextjs-rsc-"));
  const logs = join(artifacts, label, scenario);
  await mkdir(logs, { recursive: true });
  console.log(`\n${label}/${scenario} compiler: ${pinned}`);
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
    await Bun.write(
      join(project, "app/page.js"),
      `export { make as default } from "../src/${entries[scenario]}.res.js";\n`,
    );
    await command(["bun", "install"], project, join(logs, "install.log"));
    await command(
      ["bun", "run", "res:build"],
      project,
      join(logs, "rescript.log"),
    );
    if (scenario === "incremental") await incrementalRebuild(project, logs);
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

await rm(artifacts, { recursive: true, force: true });
await mkdir(artifacts, { recursive: true });
if (baseline) {
  try {
    await check(await compilerPackage(baseline), "baseline", "nested");
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
const pinned = await compilerPackage(compiler);
const results = [];
const failures = [];
for (const scenario of scenarios) {
  try {
    await check(pinned, "candidate", scenario);
    results.push({ scenario, status: "passed" });
  } catch (error) {
    console.error(`\n${scenario}: ${error.message}`);
    results.push({ scenario, status: "failed", error: error.message });
    failures.push(error);
  }
}
await Bun.write(
  join(artifacts, "summary.json"),
  JSON.stringify({ compiler: pinned, results }, null, 2) + "\n",
);
console.table(results);
if (failures.length > 0) {
  throw new AggregateError(failures, "Next.js RSC compatibility checks failed");
}
