// Resolve moving pkg.pr.new refs afresh, even when Bun has cached a lock.
export async function compilerPackage(selector) {
  let spec = selector.trim();
  if (!spec) throw new Error("Compiler selector must not be empty.");
  if (spec === "master" || /^(?:pr:)?\d+$|^[a-f0-9]{7,40}$/.test(spec)) {
    spec = `https://pkg.pr.new/rescript-lang/rescript@${spec.replace(/^pr:/, "")}`;
  }
  if (!spec.startsWith("https://pkg.pr.new/")) return spec;
  const response = await fetch(spec, { method: "HEAD" });
  if (!response.ok) {
    throw new Error(
      `Compiler package unavailable (${response.status}): ${spec}`,
    );
  }
  const commit = response.headers.get("x-commit-key")?.split(":").at(-1);
  if (!commit || !/^[a-f0-9]{7,40}$/.test(commit)) {
    throw new Error(`Missing compiler commit in pkg.pr.new response: ${spec}`);
  }
  return spec.replace(/@[^@/]+$/, `@${commit}`);
}
