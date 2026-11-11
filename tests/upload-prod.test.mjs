import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { uploadProduction } from "../scripts/upload-prod.js";

for (const scenario of ["cancel", "success", "failure"]) {
  test(`production upload: ${scenario}`, async () => {
    const directory = mkdtempSync(join(tmpdir(), "upload-test-"));
    const artifact = join(directory, "plugin.zip");
    writeFileSync(artifact, "tested artifact");
    let snapshot;
    const calls = [];
    const messages = [];
    const inputs = ["production", "production-user"];
    const options = {
      artifact,
      env: { KINTONE_PASSWORD: "test-password", KINTONE_BASIC_AUTH_PASSWORD: "test-basic" },
      askInput: async ({ validate }) => {
        if (inputs.length === 2) {
          for (const invalid of ["", "a.b", "https://example.cybozu.com", "-example", "example-", "a".repeat(64)]) {
            assert.notEqual(validate(invalid), true);
          }
          assert.equal(validate(" Example-1 "), true);
        }
        const answer = inputs.shift();
        assert.equal(validate(answer), true);
        return answer;
      },
      askPassword: async () => "production-password",
      askConfirm: async ({ default: defaultValue }) => {
        assert.equal(defaultValue, false);
        // The watched original may change during confirmation.
        writeFileSync(artifact, "changed artifact");
        return scenario !== "cancel";
      },
      log: (message) => messages.push(message),
      run: (command, args, settings) => {
        calls.push(args);
        snapshot = args[args.indexOf("--input") + 1];
        assert.equal(readFileSync(snapshot, "utf8"), "tested artifact");
        if (args.includes("info")) {
          assert.equal(settings.env.KINTONE_PASSWORD, undefined);
          return { status: 0, stdout: JSON.stringify({ name: "Demo", id: "id", version: "1" }) };
        }
        assert.ok(!args.includes("--watch"));
        assert.ok(!args.includes("production-password"));
        assert.equal(settings.env.KINTONE_PASSWORD, "production-password");
        assert.equal(settings.env.KINTONE_BASE_URL, "https://production.cybozu.com");
        assert.equal(settings.env.KINTONE_BASIC_AUTH_PASSWORD, undefined);
        return { status: scenario === "failure" ? 1 : 0 };
      },
    };
    try {
      if (scenario === "failure") await assert.rejects(uploadProduction(options), /失敗/);
      else await uploadProduction(options);
      assert.equal(calls.length, scenario === "cancel" ? 1 : 2);
      assert.equal(existsSync(snapshot), false);
      assert.ok(!messages.join().includes("production-password"));
      if (scenario === "success") assert.match(messages.at(-1), /アプリを更新/);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
}
