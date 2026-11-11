import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../dist/plugin/js/plugin.js", import.meta.url), "utf8");
function setup(message, hasSpace = true) {
  const elements = new Map();
  let handler;
  const document = {
    getElementById: (id) => elements.get(id),
    createElement: () => ({
      style: {},
      remove() { elements.delete(this.id); },
    }),
  };
  const space = { appendChild(element) { elements.set(element.id, element); } };
  runInNewContext(source, {
    document,
    kintone: {
      $PLUGIN_ID: "demo-plugin",
      plugin: { app: { getConfig(id) {
        assert.equal(id, "demo-plugin");
        return { message };
      } } },
      events: { on(name, callback) {
        assert.equal(name, "app.record.detail.show");
        handler = callback;
      } },
      app: { record: { getHeaderMenuSpaceElement: () => hasSpace ? space : null } },
    },
  });
  return { handler, elements };
}

test("saved message is displayed as text, preserves newlines, and does not duplicate", () => {
  const { handler, elements } = setup("<img src=x onerror=alert(1)>\n確認してください");
  const event = {};
  assert.equal(handler(event), event);
  const banner = elements.get("plugin-message-demo-plugin");
  assert.equal(banner.textContent, "<img src=x onerror=alert(1)>\n確認してください");
  assert.equal(banner.innerHTML, undefined);
  assert.equal(banner.style.whiteSpace, "pre-wrap");
  handler(event);
  assert.equal(elements.size, 1);
});

for (const message of [undefined, "", "   "]) {
  test(`unconfigured message (${JSON.stringify(message)}) is not displayed`, () => {
    const { handler, elements } = setup(message);
    handler({});
    assert.equal(elements.size, 0);
  });
}

test("missing header space is harmless", () => {
  const { handler, elements } = setup("message", false);
  const event = {};
  assert.equal(handler(event), event);
  assert.equal(elements.size, 0);
});
