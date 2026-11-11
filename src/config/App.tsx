import { useState } from "react";
import type { FormEvent } from "react";

function App({ pluginId }: { pluginId: string }) {
  const [message, setMessage] = useState(
    () => kintone.plugin.app.getConfig(pluginId).message ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function backToAppSettings() {
    // ゲストスペース内でも、現在のスペースのアプリ設定へ戻る。
    const prefix = window.location.pathname.match(/^\/k(?:\/guest\/\d+)?/)?.[0] ?? "/k";
    window.location.assign(`${prefix}/admin/app/flow?app=${kintone.app.getId()}`);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = message.trim();
    if (!value) {
      setError("表示するメッセージを入力してください。");
      return;
    }
    setSaving(true);
    setError("");
    setStatus("");
    try {
      kintone.plugin.app.setConfig({ message: value }, () => {
        setSaving(false);
        setStatus("保存しました。アプリの設定に戻り「アプリを更新」を実行してから、レコード詳細画面で確認してください。");
      });
    } catch {
      setSaving(false);
      setError("保存できませんでした。画面を再読み込みして、もう一度お試しください。");
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-8 text-slate-800">
      <h1 className="mb-3 text-2xl font-bold">メッセージ表示プラグインの設定</h1>
      <p id="message-help" className="mb-6 text-sm leading-6">
        保存したメッセージを、PC版のレコード詳細画面の上部に表示します。
        設定の保存と読み込みを試すためのサンプルです。
      </p>
      <form onSubmit={save}>
        <label htmlFor="message" className="mb-2 block font-semibold">表示するメッセージ</label>
        <textarea
          id="message"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setStatus("");
            setError("");
          }}
          required
          maxLength={500}
          rows={4}
          disabled={saving}
          aria-describedby="message-help message-limit"
          className="w-full rounded border border-slate-400 p-3 focus:outline-2 focus:outline-blue-600"
          placeholder="例：内容を確認してから承認してください。"
        />
        <p id="message-limit" className="mt-1 text-sm text-slate-600">500文字以内。HTMLは使用できません。</p>
        <button type="submit" disabled={saving} className="mt-5 cursor-pointer rounded bg-blue-700 px-6 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "保存中…" : "保存する"}
        </button>
        <button
          type="button"
          onClick={backToAppSettings}
          disabled={saving}
          className="ml-4 cursor-pointer rounded border border-slate-400 px-6 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          アプリ設定に戻る
        </button>
        <p className="mt-3 text-sm text-slate-600">戻る操作では変更は保存されません。先に「保存する」を押してください。</p>
        <p role="status" className="mt-4 text-sm text-green-800">{status}</p>
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      </form>
    </main>
  );
}

export default App;
