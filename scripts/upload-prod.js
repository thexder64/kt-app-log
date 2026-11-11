import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { input, password, confirm } from "@inquirer/prompts";

const cli = fileURLToPath(new URL("../node_modules/@kintone/cli/cli.js", import.meta.url));

export async function uploadProduction({
  askInput = input, askPassword = password, askConfirm = confirm,
  run = spawnSync, log = console.log, env = process.env,
  artifact = "dist/plugin.zip",
} = {}) {
  // テスト済み ZIP のコピーを固定し、監視プロセスによる更新の影響を避ける。
  const bytes = readFileSync(artifact);
  const directory = mkdtempSync(join(tmpdir(), "kintone-production-"));
  try {
    const snapshot = join(directory, "plugin.zip");
    writeFileSync(snapshot, bytes, { mode: 0o600 });
    const cleanEnv = { ...env };
    // テスト環境の認証・追加認証を意図せず引き継がない。
    for (const name of Object.keys(cleanEnv)) {
      if (name.startsWith("KINTONE_")) delete cleanEnv[name];
    }
    const info = run(process.execPath,
      [cli, "plugin", "info", "--input", snapshot, "--format", "json"],
      { encoding: "utf8", env: cleanEnv });
    if (info.error || info.status !== 0) throw new Error("ZIP のプラグイン情報を取得できません。成果物を確認してください。");
    const plugin = JSON.parse(info.stdout);
    const subdomain = await askInput({
      message: "本番環境のサブドメイン（example.cybozu.com の example 部分）",
      validate: (value) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(value.trim()) ||
        "サブドメインのみ入力してください（英数字とハイフン、先頭・末尾は英数字、63文字以内）。",
    });
    const target = `https://${subdomain.trim().toLowerCase()}.cybozu.com`;
    const username = await askInput({ message: "本番環境のユーザー名", validate: (value) => !!value.trim() || "ユーザー名を入力してください。" });
    const secret = await askPassword({ message: "本番環境のパスワード", mask: "*", validate: (value) => !!value || "パスワードを入力してください。" });
    log(`送信先: ${target}\nプラグイン: ${plugin.name}\nID: ${plugin.id}\nバージョン: ${plugin.version}\nSHA-256: ${createHash("sha256").update(bytes).digest("hex")}`);
    log("同じプラグインを利用するアプリへの影響を確認してください。アップロード後は、対象アプリを手動で更新する必要があります。");
    if (!await askConfirm({ message: "この ZIP を本番環境へ1回アップロードしますか？", default: false })) {
      log("アップロードを中止しました。");
      return;
    }
    const result = run(process.execPath,
      [cli, "plugin", "upload", "--input", snapshot, "--yes", "--log-level", "none"],
      { stdio: "ignore", env: { ...cleanEnv, KINTONE_BASE_URL: target, KINTONE_USERNAME: username, KINTONE_PASSWORD: secret } });
    if (result.error || result.status !== 0) {
      throw new Error("本番アップロードに失敗しました。接続先・認証情報・権限・通信設定を確認してください。自動再試行は行いません。");
    }
    log("アップロードが完了しました。kintone の各対象アプリの設定画面で「アプリを更新」を実行してください。");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error("対話入力できるターミナルで npm run upload:prod を実行してください。");
    process.exitCode = 1;
  } else {
    uploadProduction().catch((error) => {
      console.error(error.name === "ExitPromptError" ? "アップロードを中止しました。" : error.message);
      process.exitCode = 1;
    });
  }
}
