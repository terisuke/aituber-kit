/**
 * RAGドキュメント登録スクリプト
 *
 * 使用方法:
 *   npx ts-node scripts/loadRagDocuments.ts [ディレクトリパス]
 *
 * 例:
 *   npx ts-node scripts/loadRagDocuments.ts ./knowledge
 *
 * 環境変数（オプション）:
 *   OLLAMA_URL - OllamaのURL（デフォルト: http://localhost:11434）
 *   OLLAMA_EMBEDDING_MODEL - Embeddingモデル（デフォルト: nomic-embed-text）
 *   CHROMA_URL - ChromaDBのURL（デフォルト: http://localhost:8000）
 *   RAG_COLLECTION_NAME - コレクション名（デフォルト: aituber_knowledge）
 */

import * as path from 'path'
import * as dotenv from 'dotenv'

// .envファイルを読み込み
dotenv.config()

// LangChainのインポート
import { TextLoader } from 'langchain/document_loaders/fs/text'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { Document } from 'langchain/document'
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama'
import { Chroma } from '@langchain/community/vectorstores/chroma'
import * as fs from 'fs'

// 設定
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const EMBEDDING_MODEL =
  process.env.OLLAMA_EMBEDDING_MODEL ||
  process.env.NEXT_PUBLIC_RAG_EMBEDDING_MODEL ||
  'nomic-embed-text'
const CHROMA_URL =
  process.env.CHROMA_URL ||
  process.env.NEXT_PUBLIC_RAG_CHROMA_URL ||
  'http://localhost:8000'
const COLLECTION_NAME =
  process.env.RAG_COLLECTION_NAME ||
  process.env.NEXT_PUBLIC_RAG_COLLECTION_NAME ||
  'aituber_knowledge'

/**
 * テキストファイルを読み込み、チャンクに分割する
 */
async function loadAndSplitDocument(
  filePath: string,
  chunkSize: number = 1000,
  chunkOverlap: number = 200
): Promise<Document[]> {
  const loader = new TextLoader(filePath)
  const docs = await loader.load()

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ['\n\n', '\n', ' ', ''],
  })

  return await splitter.splitDocuments(docs)
}

/**
 * ディレクトリ内の全テキストファイルを読み込む
 */
async function loadDocumentsFromDirectory(
  dirPath: string,
  extensions: string[] = ['.txt', '.md']
): Promise<Document[]> {
  const allDocs: Document[] = []

  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`)
  }

  const files = fs.readdirSync(dirPath)

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    if (extensions.includes(ext)) {
      const filePath = path.join(dirPath, file)
      console.log(`📄 Loading: ${filePath}`)
      const docs = await loadAndSplitDocument(filePath)
      allDocs.push(...docs)
    }
  }

  return allDocs
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2)
  const knowledgeDir = args[0] || path.join(process.cwd(), 'knowledge')

  console.log('🚀 RAG Document Loader')
  console.log('========================')
  console.log(`📁 Knowledge directory: ${knowledgeDir}`)
  console.log(`🔗 Ollama URL: ${OLLAMA_URL}`)
  console.log(`🧠 Embedding model: ${EMBEDDING_MODEL}`)
  console.log(`💾 ChromaDB URL: ${CHROMA_URL}`)
  console.log(`📚 Collection name: ${COLLECTION_NAME}`)
  console.log('========================\n')

  // ディレクトリ存在確認
  if (!fs.existsSync(knowledgeDir)) {
    console.error(`❌ Error: Directory not found: ${knowledgeDir}`)
    console.log(
      '\n💡 Hint: Create the directory and add .txt or .md files to it.'
    )
    process.exit(1)
  }

  // ドキュメント読み込み
  console.log('📚 Loading documents...')
  const documents = await loadDocumentsFromDirectory(knowledgeDir)

  if (documents.length === 0) {
    console.error('❌ Error: No .txt or .md files found in the directory')
    console.log('\n💡 Hint: Add some .txt or .md files to the knowledge directory.')
    process.exit(1)
  }

  console.log(`✅ Loaded ${documents.length} chunks from documents\n`)

  // Embedding作成
  console.log('🔄 Creating embeddings...')
  const embeddings = new OllamaEmbeddings({
    baseUrl: OLLAMA_URL,
    model: EMBEDDING_MODEL,
  })

  // ChromaDBに保存
  console.log('💾 Storing in ChromaDB...')
  try {
    await Chroma.fromDocuments(documents, embeddings, {
      collectionName: COLLECTION_NAME,
      url: CHROMA_URL,
    })
    console.log('\n✅ Documents loaded successfully!')
    console.log(`📊 Total chunks: ${documents.length}`)
    console.log(`📚 Collection: ${COLLECTION_NAME}`)
  } catch (error) {
    console.error('\n❌ Error storing documents:', error)
    console.log('\n💡 Troubleshooting:')
    console.log('  1. Make sure ChromaDB is running: docker run -d -p 8000:8000 chromadb/chroma')
    console.log('  2. Make sure Ollama is running with the embedding model: ollama pull ' + EMBEDDING_MODEL)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
