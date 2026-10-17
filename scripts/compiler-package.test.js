import { afterEach, expect, mock, spyOn, test } from "bun:test";
import { compilerPackage } from "./compiler-package.js";

const base = "https://pkg.pr.new/rescript-lang/rescript@";
const commit = "ee81531f49bda16fecf77e2c0563ae6d9a5a31ec";
const published = (hash) =>
  new Response(null, {
    headers: { "x-commit-key": `rescript-lang:rescript:${hash}` },
  });

afterEach(() => mock.restore());

test.each([
  ["master", "master"],
  ["8886", "8886"],
  ["pr:8886", "8886"],
  [" 8886 ", "8886"],
  [`${base}8886`, "8886"],
])(
  "pins compiler selector %s to its published commit",
  async (selector, ref) => {
    const fetch = spyOn(globalThis, "fetch").mockResolvedValue(
      published(commit),
    );
    expect(await compilerPackage(selector)).toBe(`${base}${commit}`);
    expect(fetch).toHaveBeenCalledWith(`${base}${ref}`, { method: "HEAD" });
  },
);

test.each([commit, commit.slice(0, 9)])(
  "accepts immutable commit %s",
  async (hash) => {
    spyOn(globalThis, "fetch").mockResolvedValue(published(hash));
    expect(await compilerPackage(hash)).toBe(`${base}${hash}`);
  },
);

test.each(["12.3.1", "latest"])(
  "preserves npm selector %s",
  async (selector) => {
    const fetch = spyOn(globalThis, "fetch");
    expect(await compilerPackage(selector)).toBe(selector);
    expect(fetch).not.toHaveBeenCalled();
  },
);

test("rejects an unavailable PR build", async () => {
  spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(null, { status: 404 }),
  );
  await expect(compilerPackage("8886")).rejects.toThrow(
    "Compiler package unavailable (404)",
  );
});

test("rejects metadata that does not identify an immutable commit", async () => {
  spyOn(globalThis, "fetch").mockResolvedValue(published("master"));
  await expect(compilerPackage("master")).rejects.toThrow(
    "Missing compiler commit",
  );
});

test("rejects empty input", async () => {
  await expect(compilerPackage("  ")).rejects.toThrow(
    "Compiler selector must not be empty",
  );
});
