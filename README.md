# React / TypeScript kintone プラグイン開発基盤

React 19、Tailwind CSS 4、Vite 6 で設定画面とプラグイン本体をビルドし、
`@kintone/cli` で署名・アップロードします。Node.js 20 以上が必要です（`.nvmrc`: 20）。

## セットアップとローカル確認

```sh
npm ci
npm run build
npm run pack
```

出力は `dist/plugin.zip`。kintone に手動で取り込むこともできます。
`npm run build` は TypeScript のチェックと Vite ビルドまで行い、署名は `npm run pack` で行います。

```sh
npm run dev:local
```

初回ビルド・署名後、変更を監視して ZIP を更新します。アップロードはしません。
監視中の再ビルドは Vite によるもので、型チェックは `npm run build` で実行してください。
終了は Ctrl+C。HTTP 開発サーバーを起動する構成ではありません。

## 署名鍵

既存の `dist/*.ppk` は移行時にそのまま使用します。
鍵がない初回は `keys/private.ppk` を生成します。
任意の既存鍵を使う場合は `KINTONE_PRIVATE_KEY` にパスを指定します。
複数の鍵がある場合も、この変数で使用する鍵を明示してください。

秘密鍵は Git にコミットせず、安全な場所にバックアップしてください。
同じプラグインの更新には同じ鍵が必要です。旧構成の鍵は `dist` にあるため、
`dist` を削除する前に必ず保管してください。新しいプラグインには別の鍵を生成します。

## テスト環境へのアップロード

`.env.example` を `.env.development` にコピーして接続先・認証情報を設定するか、
実行環境に次の変数を設定してください。既存の環境変数がファイルより優先されます。

- `KINTONE_BASE_URL`
- `KINTONE_USERNAME`
- `KINTONE_PASSWORD`

```sh
npm run upload                 # 作成済み ZIP を確認プロンプト付きで1回送信
npm run upload -- --watch      # ZIP の変更を監視して送信
npm run dev                    # 初回ビルド・署名後、テスト環境に自動送信し変更も監視
```

`npm run dev` は `--watch --yes` で確認を省略してアップロードします。
必ずテスト環境を設定してください。本番反映は下記の専用コマンドを使用してください。
`npm run upload` はビルドし直さず、現在の `dist/plugin.zip` を送信します。

## cli-kintone への移行

`@kintone/plugin-packer` と `@kintone/plugin-uploader` を `@kintone/cli` に統合しました。
署名は `plugin pack --input dist/plugin/manifest.json`、アップロードは `plugin upload` を使用します。
鍵の初回生成は `plugin keygen` で行います。独自のパッケージ監視は CLI の `--watch` に置き換えました。
アップロードは REST API を使うため、Puppeteer / Chrome のインストールは不要です。

## ソース

- `src/config/`: React による設定画面
- `src/plugin/plugin.ts`: kintone アプリ上で動く処理
- `src/manifest.json`: プラグインの定義

## メッセージ表示デモの確認

1. ビルド・署名した ZIP を検証用 kintone にアップロードし、アプリにプラグインを追加します。
2. プラグイン設定画面でメッセージを入力して「保存する」を押します。
3. アプリ設定に戻り「アプリを更新」を実行します。
4. PC版でレコード詳細画面を開くと、上部に保存したメッセージが表示されます。
5. 設定画面を開き直すと、保存した値が読み込まれます。

設定はアプリごとに `kintone.plugin.app.setConfig` で保存し、
`getConfig` で読み込みます。未設定時は何も表示しません。
メッセージは500文字以内のテキストです。改行に対応し、HTMLは解釈しません。
レコードデータの変更、一覧・編集・モバイル画面への表示は行いません。

## 自動テスト

`npm test` でビルドと、kintone API・DOM を模した表示処理のテストを実行します。
実環境での設定保存・アプリ更新・画面表示は、上記の手順で別途確認してください。

## 本番への単発アップロード

```sh
npm run upload:prod
```

対話可能なターミナルで実行してください。テスト済みの `dist/plugin.zip` をそのまま使い、
再ビルドや監視は行いません。初めに ZIP を一時コピーして固定し、終了・中止時に削除します。
本番のサブドメイン、ユーザー名、パスワード（マスク表示）を毎回入力します。
例：`example` と入力すると `https://example.cybozu.com` が送信先になります。
`cybozu.com` の環境が対象です。確認画面には完全な URL を表示します。
`.env.development` や既存の `KINTONE_*` は使わず、入力した認証情報はファイルに保存しません。
送信先、プラグイン名・ID・バージョン、ZIP の SHA-256 を確認し、同意した場合だけ1回送信します。
確認の既定値は「いいえ」です。追加の Basic 認証やクライアント証明書が必要な環境には未対応です。
失敗時は自動再試行しません。

**アップロード後は、対象アプリの設定画面で「アプリを更新」を手動実行してください。**
プラグインのアップロードとアプリの更新は別工程です。
