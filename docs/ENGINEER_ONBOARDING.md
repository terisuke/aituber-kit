# エンジニア向けオンボーディング & 実装タスク

## プロジェクト概要

**目標**: AIキャラクターがロボットを制御する展示デモ

- 3Dキャラクターと音声で会話
- **「ETごっこしよう！」でLeRobotが指タッチ動作** ✅ 実装済み
- **RAGでシステム説明が可能** ✅ 実装済み
- **完全ローカル動作**（Ollama + VOICEVOX）

## 現状確認タスク

### 1. 環境セットアップ確認

```bash
cd /Users/teradakousuke/Developer/local-robot-character

# 依存関係インストール
npm install

# 環境変数ファイル作成
cp .env.example .env

# Ollamaの動作確認
ollama list
ollama run llama3.2  # または使用するモデル

# VOICEVOXの動作確認
curl http://localhost:50021/version
```

### 2. .env 最小設定（Ollama + VOICEVOX + RAG + LeRobot用）

以下の値を`.env`に設定してください：

```env
# AI設定 - Ollamaを使用
NEXT_PUBLIC_SELECT_AI_SERVICE="ollama"
NEXT_PUBLIC_LOCAL_LLM_URL="http://localhost:11434/v1/chat/completions"
NEXT_PUBLIC_LOCAL_LLM_MODEL="llama3.2"

# 音声設定 - VOICEVOXを使用
NEXT_PUBLIC_SELECT_VOICE="voicevox"
VOICEVOX_SERVER_URL="http://localhost:50021"
NEXT_PUBLIC_VOICEVOX_SPEAKER="46"

# 言語設定
NEXT_PUBLIC_SELECT_LANGUAGE="ja"

# RAG設定（知識検索機能）
NEXT_PUBLIC_ENABLE_RAG="true"
NEXT_PUBLIC_RAG_EMBEDDING_MODEL="nomic-embed-text"
NEXT_PUBLIC_RAG_CHROMA_URL="http://localhost:8000"
NEXT_PUBLIC_RAG_COLLECTION_NAME="aituber_knowledge"
OLLAMA_URL="http://localhost:11434"
OLLAMA_EMBEDDING_MODEL="nomic-embed-text"

# LeRobot設定（ロボット制御）
LEROBOT_SERVER_URL="http://localhost:8080"
LEROBOT_USE_MOCK="true"  # 実機がない場合はtrue
```

### 3. 動作確認

```bash
npm run dev
# http://localhost:3000 を開く
```

確認ポイント：

- [ ] キャラクターが表示される
- [ ] テキスト入力で会話できる
- [ ] 音声が再生される
- [ ] マイク入力が機能する

---

## アーキテクチャ理解

### ディレクトリ構造（重要ファイル）

```
src/
├── features/
│   ├── chat/
│   │   ├── aiChatFactory.ts    # LLMプロバイダー振り分け ★
│   │   ├── handlers.ts         # チャット処理メイン（RAG/LeRobot統合） ★
│   │   └── vercelAIChat.ts     # Ollama含むLLM呼び出し ★
│   ├── rag/                    # ✅ 実装済み
│   │   ├── chromaClient.ts     # ChromaDB接続
│   │   ├── embeddings.ts       # Ollama Embeddings
│   │   ├── retriever.ts        # RAG検索
│   │   └── documentLoader.ts   # ドキュメント読み込み
│   ├── robot/                  # ✅ 実装済み
│   │   ├── intentDetector.ts   # 「ETごっこ」検出
│   │   └── lerobotClient.ts    # LeRobotサーバー通信
│   ├── constants/
│   │   └── settings.ts         # AIService型定義
│   ├── messages/
│   │   └── synthesizeVoiceVoicevox.ts  # VOICEVOX連携
│   └── stores/
│       └── settings.ts         # Zustand状態管理（RAG設定含む）
├── pages/
│   └── api/
│       ├── ai/
│       │   └── vercel.ts       # AIルート
│       ├── rag-search.ts       # ✅ RAG検索API
│       └── robot/
│           └── trigger.ts      # ✅ ロボット制御API
├── components/
│   └── settings/
│       └── modelProvider.tsx   # RAG設定UI
├── scripts/
│   └── loadRagDocuments.ts     # RAGドキュメント登録スクリプト
└── knowledge/                  # RAGナレッジベース
    ├── system-overview.md
    ├── tech-stack.md
    └── ...
```

### データフロー

```
ユーザー入力 → handlers.ts
                  ↓
        ┌─────────────────────┐
        │ intentDetector.ts   │  ←-- 「ETごっこ」検出
        └─────────────────────┘
                  ↓
        ┌─── et_gokko? ───┐
        │                 │
        ↓ Yes             ↓ No
   /api/robot/trigger     │
        ↓                 │
   LeRobot Server         │
        ↓                 │
   キャラ応答             │
   「指を出してね！」      │
        │                 │
        │         ┌───────┴───────┐
        │         │ RAG検索       │
        │         │ (enableRAG時)  │
        │         └───────┬───────┘
        │                 ↓
        │         systemPrompt + RAGコンテキスト
        │                 ↓
        │         aiChatFactory.ts → Ollama API
        │                 ↓
        └────────> speakQueue.ts → VOICEVOX
                          ↓
                  音声再生 + リップシンク
```

---

## 実装タスク（優先順）

### Phase 1: 基本動作確認 ✅ 完了

- [x] Ollama設定
- [x] VOICEVOX設定
- [x] 動作確認テスト

### Phase 2: RAG機能追加 ✅ 完了

**目的**: システム説明用のナレッジベースを追加

#### 実装済みファイル

```
src/features/rag/
├── chromaClient.ts     # ChromaDB連携
├── embeddings.ts       # Ollama Embeddings
├── retriever.ts        # RAG検索
├── documentLoader.ts   # ドキュメント読み込み
└── index.ts            # エクスポート
```

#### セットアップ手順

```bash
# 1. ChromaDBを起動
docker run -d -p 8000:8000 chromadb/chroma

# 2. Embeddingモデルを取得
ollama pull nomic-embed-text

# 3. ナレッジをロード（/knowledge/ディレクトリから）
npm run rag:load ./knowledge

# 4. 設定画面でRAGを有効化、またはENV設定
NEXT_PUBLIC_ENABLE_RAG="true"
```

#### ナレッジファイルの配置

`/knowledge/` ディレクトリに `.md` または `.txt` ファイルを配置

```markdown
<!-- /knowledge/system-overview.md の例 -->

# AITuber Robot Controller

## 概要

完全ローカルで動くAIアシスタント × ロボットMVP
「ETごっこしよう」と話しかけると、ロボットアームが指先にタッチしてくれる

## 技術スタック

- LLM: Ollama (gemma3等)
- 音声合成: VOICEVOX
- ロボット制御: LeRobot ACTPolicy
- 知識検索: ChromaDB + EmbeddingGemma
```

### Phase 3: LeRobot連携 ✅ 完了

**目的**: キャラクターの発話トリガーでロボット動作

#### 実装済みファイル

```
src/features/robot/
├── intentDetector.ts   # 「ETごっこ」等のインテント検出
├── lerobotClient.ts    # LeRobotサーバーとの通信（タイムアウト付き）
└── index.ts            # エクスポート

src/pages/api/robot/
└── trigger.ts          # ロボット制御API
```

#### インテント検出キーワード

以下のキーワードを含むメッセージで自動トリガー：

- `ETごっこ`, `etごっこ`, `イーティーごっこ`
- `ET ごっこ`（半角/全角スペース対応）
- `指タッチ`, `ロボットとタッチ`

#### 動作フロー

1. ユーザーが「ETごっこしよう」と入力
2. `intentDetector.ts` がキーワードを検出
3. `/api/robot/trigger` が LeRobot サーバーにリクエスト
4. キャラクターが「いいよ！指を出してね！」と応答
5. 音声再生完了まで入力がブロックされる

#### モックモードでのテスト

実機がない場合は `.env` で `LEROBOT_USE_MOCK="true"` を設定

---

## 展示会動作確認チェックリスト

展示会前に以下を確認してください：

- [ ] Ollama が起動している（`ollama list`）
- [ ] VOICEVOX が起動している（`curl http://localhost:50021/version`）
- [ ] ChromaDB が起動している（`docker ps`）
- [ ] RAG用ナレッジがロード済み（`npm run rag:load ./knowledge`）
- [ ] 設定画面でRAGが有効化されている
- [ ] 「ETごっこしよう」でロボットAPIが呼ばれる
- [ ] 実機使用時は `LEROBOT_USE_MOCK="false"` に設定

---

## トラブルシューティング

### RAG検索が動かない

- ChromaDBが起動しているか確認
- `npm run rag:load` でドキュメントがロードされているか確認
- 設定画面でRAGが有効化されているか確認

### LeRobotが反応しない

- 「ETごっこ」等のキーワードが正確か確認
- `LEROBOT_USE_MOCK` 設定を確認
- ブラウザのコンソールでAPIレスポンスを確認

---

## 質問・相談先

不明点があれば、こうすけさんに確認してください。
特にLeRobotとの連携部分は、トレーニング済みモデルの状況次第で調整が必要です。
