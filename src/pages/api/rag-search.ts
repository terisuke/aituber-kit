import type { NextApiRequest, NextApiResponse } from 'next'
import { Chroma } from '@langchain/community/vectorstores/chroma'
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama'

interface RAGSearchRequest {
  query: string
  ollamaUrl?: string
  embeddingModel?: string
  chromaUrl?: string
  collectionName?: string
  topK?: number
}

interface RAGSearchResponse {
  success: boolean
  context?: string
  error?: string
}

const DEFAULT_CONFIG = {
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
  chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
  collectionName: process.env.CHROMA_COLLECTION_NAME || 'aituber_knowledge',
  topK: 3,
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RAGSearchResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const {
      query,
      ollamaUrl = DEFAULT_CONFIG.ollamaUrl,
      embeddingModel = DEFAULT_CONFIG.embeddingModel,
      chromaUrl = DEFAULT_CONFIG.chromaUrl,
      collectionName = DEFAULT_CONFIG.collectionName,
      topK = DEFAULT_CONFIG.topK,
    }: RAGSearchRequest = req.body

    if (!query || typeof query !== 'string') {
      return res
        .status(400)
        .json({ success: false, error: 'Query is required' })
    }

    // Embeddingsの作成
    const embeddings = new OllamaEmbeddings({
      baseUrl: ollamaUrl,
      model: embeddingModel,
    })

    // 既存のChromaコレクションに接続
    const vectorStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName,
      url: chromaUrl,
    })

    // 類似度検索を実行
    const results = await vectorStore.similaritySearch(query, topK)

    if (results.length === 0) {
      return res.status(200).json({ success: true, context: '' })
    }

    // 結果を結合
    const context = results.map((doc) => doc.pageContent).join('\n\n---\n\n')

    return res.status(200).json({ success: true, context })
  } catch (error) {
    console.error('RAG search error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
