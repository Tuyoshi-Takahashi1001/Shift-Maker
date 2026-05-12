# Shift Maker

Googleカレンダーから案件別にシフト表を生成するWebアプリ。

## デプロイ手順

### 1. GitHubにリポジトリを作成してpush

```bash
cd shift-maker
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/shift-maker.git
git push -u origin main
```

### 2. Google Cloud ConsoleでOAuth設定

1. https://console.cloud.google.com にアクセス
2. 新しいプロジェクトを作成（例：shift-maker）
3. 左メニュー「APIとサービス」→「有効なAPIとサービス」→「Google Calendar API」を有効化
4. 「認証情報」→「認証情報を作成」→「OAuthクライアントID」
5. アプリケーションの種類：「ウェブアプリケーション」
6. 承認済みのリダイレクトURIに追加：
   - `https://あなたのアプリ名.vercel.app/api/auth`
7. クライアントIDとクライアントシークレットをコピー

### 3. Vercelにデプロイ

1. https://vercel.com にGitHubアカウントでログイン
2. 「New Project」→ GitHubのshift-makerリポジトリを選択
3. 「Environment Variables」に以下を追加：
   - `GOOGLE_CLIENT_ID` = 手順2で取得したクライアントID
   - `GOOGLE_CLIENT_SECRET` = 手順2で取得したクライアントシークレット
   - `GOOGLE_REDIRECT_URI` = `https://あなたのアプリ名.vercel.app/api/auth`
4. 「Deploy」をクリック

### 4. 使い方

1. デプロイされたURLを開く
2. 「Googleカレンダーに接続」をクリックしてログイン
3. 案件名を入力して「検索」
4. シフト表が生成されたら担当者・メモを編集
5. チェックボックスで行を選択してPDF/テキスト出力

## 担当者リストの変更

`api/calendar.js` の `STAFF` 配列を編集してください：

```javascript
const STAFF = ['宮田','樽田','箕輪', ... ];
```
