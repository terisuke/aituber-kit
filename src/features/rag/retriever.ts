/**
 * RAG検索の設定
 */
export interface RAGSearchConfig {
  ollamaUrl: string
  embeddingModel: string
  chromaUrl: string
  collectionName: string
  topK: number
}

/**
 * デフォルトのRAG検索設定
 */
export const DEFAULT_RAG_CONFIG: RAGSearchConfig = {
  ollamaUrl: 'http://localhost:11434',
  embeddingModel: 'nomic-embed-text',
  chromaUrl: 'http://localhost:8000',
  collectionName: 'aituber_knowledge',
  topK: 3,
}

/**
 * RAG検索を実行し、関連ドキュメントを取得する（APIルート経由）
 * @param query 検索クエリ
 * @param config RAG検索設定
 * @returns 検索結果のテキスト（複数ドキュメントを結合）
 */
export async function searchRAG(
  query: string,
  config: Partial<RAGSearchConfig> = {}
): Promise<string> {
  const mergedConfig = { ...DEFAULT_RAG_CONFIG, ...config }

  try {
    const response = await fetch('/api/rag-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        ollamaUrl: mergedConfig.ollamaUrl,
        embeddingModel: mergedConfig.embeddingModel,
        chromaUrl: mergedConfig.chromaUrl,
        collectionName: mergedConfig.collectionName,
        topK: mergedConfig.topK,
      }),
    })

    if (!response.ok) {
      throw new Error(`RAG search failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Unknown error')
    }

    return data.context || ''
  } catch (error) {
    console.error('RAG search error:', error)
    throw error
  }
}

/**
 * RAG検索を実行（設定をシンプルに指定するバージョン）
 * @param query 検索クエリ
 * @param embeddingModel Embeddingモデル名
 * @param ollamaUrl Ollama URL
 * @param chromaUrl ChromaDB URL
 * @returns 検索結果のテキスト
 */
export async function searchRAGSimple(
  query: string,
  embeddingModel?: string,
  ollamaUrl?: string,
  chromaUrl?: string
): Promise<string> {
  return searchRAG(query, {
    embeddingModel: embeddingModel || DEFAULT_RAG_CONFIG.embeddingModel,
    ollamaUrl: ollamaUrl || DEFAULT_RAG_CONFIG.ollamaUrl,
    chromaUrl: chromaUrl || DEFAULT_RAG_CONFIG.chromaUrl,
  })
}
