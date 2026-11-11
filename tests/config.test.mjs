import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

const require = createRequire(import.meta.url);
function load(file, mocks, kintone) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require: (id) => id in mocks ? mocks[id] : require(id),
    kintone,
    document: { getElementById: () => ({}) },
  });
  return exports;
}

test("config entry captures ID before React renders, and App uses it after global ID disappears", () => {
  const kintone = {
    $PLUGIN_ID: "demo-plugin",
    plugin: { app: { getConfig(id) {
      assert.equal(id, "demo-plugin");
      return { message: "保存済みメッセージ" };
    } } },
  };
  const App = load("../src/config/App.tsx", {}, kintone).default;
  let tree;
  load("../src/config/config.tsx", {
    "./config.css": {},
    "./App.tsx": { default: App },
    "react-dom/client": { createRoot: () => ({ render(value) { tree = value; } }) },
  }, kintone);
  delete kintone.$PLUGIN_ID;
  const appElement = tree.props.children;
  assert.equal(appElement.props.pluginId, "demo-plugin");
  const html = renderToStaticMarkup(createElement(App, appElement.props));
  assert.match(html, /保存済みメッセージ/);
});
