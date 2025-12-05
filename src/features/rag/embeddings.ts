import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama'

/**
 * OllamaEmbeddingsインスタンスを作成する
 * @param baseUrl Ollama APIのベースURL
 * @param model 使用するEmbeddingモデル名
 * @returns OllamaEmbeddingsインスタンス
 */
export function createOllamaEmbeddings(
  baseUrl: string = 'http://localhost:11434',
  model: string = 'nomic-embed-text'
): OllamaEmbeddings {
  return new OllamaEmbeddings({
    baseUrl,
    model,
  })
}

/**
 * デフォルトのEmbedding設定
 */
export const DEFAULT_EMBEDDING_CONFIG = {
  baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
}
