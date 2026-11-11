import fs from "node:fs";
import dotenv from "dotenv";
import { runCli, watchCli } from "./cli.js";

dotenv.config({ path: ".env.development" });
const watch = process.argv.includes("--watch");
fs.mkdirSync("dist", { recursive: true });
const legacyKeys = fs.readdirSync("dist").filter((file) => file.endsWith(".ppk"));
let key = process.env.KINTONE_PRIVATE_KEY;
if (!key) {
  if (legacyKeys.length > 1 || (legacyKeys.length && fs.existsSync("keys/private.ppk"))) {
    throw new Error("複数の署名鍵があります。KINTONE_PRIVATE_KEY で使用する鍵を指定してください。");
  }
  key = legacyKeys.length ? `dist/${legacyKeys[0]}` : "keys/private.ppk";
  if (!fs.existsSync(key)) {
    fs.mkdirSync("keys", { recursive: true });
    runCli(["plugin", "keygen", "--output", key]);
    fs.chmodSync(key, 0o600);
  }
} else if (!fs.existsSync(key)) {
  throw new Error("KINTONE_PRIVATE_KEY に指定された署名鍵が存在しません。");
}
const args = ["plugin", "pack", "--input", "dist/plugin/manifest.json",
  "--output", "dist/plugin.zip", "--private-key", key];
if (watch) watchCli([...args, "--watch"]);
else runCli(args);
