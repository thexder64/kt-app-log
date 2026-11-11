import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./config.css";
import App from "./App.tsx";

// $PLUGIN_ID はプラグインのスクリプト実行中に取得する。
// React の描画やイベントコールバックから直接参照しない。
const pluginId = kintone.$PLUGIN_ID;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App pluginId={pluginId} />
  </StrictMode>
);
