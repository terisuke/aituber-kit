# 技術スタック

## シンプル版

Ollama、VOICEVOX、LeRobotを使っている。全部ローカルで動く。

## 詳細版

| 要素              | 技術                                     |
| ----------------- | ---------------------------------------- |
| LLM（言語モデル） | Ollama（gemma3等、モデルは切り替え可能） |
| 音声合成（TTS）   | VOICEVOX                                 |
| 音声認識（STT）   | ブラウザ Web Speech API                  |
| 3Dキャラクター    | aituber-kit（VRMモデル）                 |
| ロボット制御      | LeRobot + ACTPolicy                      |
| 知識検索（RAG）   | ChromaDB + EmbeddingGemma                |

## なぜローカルにこだわるのか

- インターネット接続なしで動作する
- プライバシーが守られる
- レイテンシが低い（クラウドへの往復がない）
- 「ローカルAI展示会」のテーマに合っている
