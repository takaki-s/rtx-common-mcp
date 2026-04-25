# rtx-common-mcp

Yamaha RTX シリーズルーターのコマンドリファレンスを AI アシスタントから参照できる [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) サーバーです。

公式マニュアルサイト（[RTpro](https://www.rtpro.yamaha.co.jp/RT/manual/rt-common/)）をリアルタイムでスクレイピングし、Claude などの LLM がコマンドの書式・説明・設定例を直接調べられるようにします。

## 機能

| ツール名 | 説明 |
|---|---|
| `list_categories` | コマンドの機能カテゴリ一覧を取得します。`parent_category` を指定するとサブカテゴリに絞り込めます。 |
| `list_commands_by_category` | 指定したカテゴリ配下のコマンド一覧を再帰的に取得します。 |
| `search_commands` | キーワードでコマンドを検索します。 |
| `get_command_details` | コマンド名を指定して、書式・説明・設定値・設定例・適用モデルなどの詳細を取得します。 |

## 必要環境

- Node.js 24 以上
- pnpm

## インストール

```bash
git clone https://github.com/your-username/rtx-common-mcp.git
cd rtx-common-mcp
pnpm install
pnpm build
```

## Claude Desktop への設定

`claude_desktop_config.json` に以下を追加してください。

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "yamaha-rtx-ref": {
      "command": "node",
      "args": ["/path/to/rtx-common-mcp/dist/index.js"]
    }
  }
}
```

`/path/to/rtx-common-mcp` はクローンしたディレクトリの絶対パスに置き換えてください。

設定後、Claude Desktop を再起動するとツールが利用可能になります。

## 使い方の例

Claude に対して自然言語で質問するだけで、コマンドリファレンスを参照できます。

```
RTX1300 で静的ルートを設定するコマンドを教えてください
```

```
NAT ディスクリプタ関連のコマンド一覧を出してください
```

```
「ip route」コマンドの書式と設定例を見せてください
```

## 開発

```bash
# テスト実行
pnpm test

# カバレッジ付きテスト
pnpm test:coverage

# Lint
pnpm lint

# ウォッチモード（ビルド）
pnpm watch
```

## 技術スタック

- [TypeScript](https://www.typescriptlang.org/) / Node.js (ESM)
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- [cheerio](https://cheerio.js.org/) — HTML スクレイピング
- [Vitest](https://vitest.dev/) — テストフレームワーク
- [pnpm](https://pnpm.io/)

## データソース

本ツールは Yamaha 公式マニュアルサイト [RTpro](https://www.rtpro.yamaha.co.jp/RT/manual/rt-common/) のコンテンツをリアルタイムで取得して使用します。コンテンツの著作権は Yamaha Corporation に帰属します。本ツールはコンテンツを内部に保持・再配布するものではなく、参照のつど公式サイトへアクセスします。

本ツールの使用はユーザー自身の責任で行ってください。

## ライセンス

MIT
