import dotenv from "dotenv";
import { runCli, watchCli } from "./cli.js";

dotenv.config({ path: ".env.development" });
const options = process.argv.slice(2);
if (options.some((arg) => !["--watch", "--yes"].includes(arg))) {
  throw new Error("使用可能なオプション: --watch --yes");
}
const missing = ["KINTONE_BASE_URL", "KINTONE_USERNAME", "KINTONE_PASSWORD"]
  .filter((name) => !process.env[name]);
if (missing.length) throw new Error(`環境変数が未設定です: ${missing.join(", ")}`);
// 認証情報は CLI が環境変数から取得する。コマンド文字列に埋め込まない。
const args = ["plugin", "upload", "--input", "dist/plugin.zip", ...options];
if (options.includes("--watch")) watchCli(args);
else runCli(args);
