// プラグインごとに一意の ID を付け、同じ画面イベントで重複表示しないようにする。
const pluginId = kintone.$PLUGIN_ID;
const elementId = `plugin-message-${pluginId}`;

kintone.events.on("app.record.detail.show", (event) => {
  document.getElementById(elementId)?.remove();
  const message = kintone.plugin.app.getConfig(pluginId).message?.trim();
  const space = kintone.app.record.getHeaderMenuSpaceElement();
  if (!message || !space) return event;

  const banner = document.createElement("div");
  banner.id = elementId;
  // 設定値を HTML として解釈せず、文字列として表示する。
  banner.textContent = message;
  Object.assign(banner.style, {
    padding: "12px 16px",
    margin: "8px 0",
    backgroundColor: "#eff6ff",
    borderLeft: "4px solid #1d4ed8",
    color: "#1e293b",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  });
  space.appendChild(banner);
  return event;
});
