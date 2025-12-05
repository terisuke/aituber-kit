import { Chroma } from '@langchain/community/vectorstores/chroma'
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama'
import { Document } from '@langchain/core/documents'

/**
 * ChromaDBの設定
 */
export interface ChromaConfig {
  collectionName: string
  url: string
}

/**
 * デフォルトのChroma設定
 */
export const DEFAULT_CHROMA_CONFIG: ChromaConfig = {
  collectionName: 'aituber_knowledge',
  url: process.env.CHROMA_URL || 'http://localhost:8000',
}

/**
 * 既存のChromaコレクションからVectorStoreを取得する
 * @param embeddings Embeddingインスタンス
 * @param config Chroma設定
 * @returns Chroma VectorStoreインスタンス
 */
export async function getExistingChromaCollection(
  embeddings: OllamaEmbeddings,
  config: ChromaConfig = DEFAULT_CHROMA_CONFIG
): Promise<Chroma> {
  return await Chroma.fromExistingCollection(embeddings, {
    collectionName: config.collectionName,
    url: config.url,
  })
}

/**
 * ドキュメントからChromaコレクションを作成する
 * @param documents ドキュメント配列
 * @param embeddings Embeddingインスタンス
 * @param config Chroma設定
 * @returns Chroma VectorStoreインスタンス
 */
export async function createChromaCollection(
  documents: Document[],
  embeddings: OllamaEmbeddings,
  config: ChromaConfig = DEFAULT_CHROMA_CONFIG
): Promise<Chroma> {
  return await Chroma.fromDocuments(documents, embeddings, {
    collectionName: config.collectionName,
    url: config.url,
  })
}
