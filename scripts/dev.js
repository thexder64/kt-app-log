import { spawn, spawnSync } from "node:child_process";

const local = process.argv.includes("--local");
function run(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
// 初回の成果物を用意してから監視を開始する。
run("node_modules/typescript/bin/tsc", ["-b"]);
run("node_modules/vite/bin/vite.js", ["build"]);
run("scripts/pack.js");
const commands = [
  ["node_modules/vite/bin/vite.js", "build", "--watch", "--emptyOutDir", "false"],
  ["scripts/pack.js", "--watch"],
];
if (!local) commands.push(["scripts/upload.js", "--watch", "--yes"]);
const children = commands.map((args) => spawn(process.execPath, args, { stdio: "inherit" }));
let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill("SIGTERM");
}
process.on("SIGINT", () => stop(130));
process.on("SIGTERM", () => stop(143));
for (const child of children) {
  child.on("error", () => stop(1));
  child.on("exit", (code) => { if (!stopping) stop(code || 1); });
}
