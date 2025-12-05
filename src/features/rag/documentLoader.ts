import { TextLoader } from 'langchain/document_loaders/fs/text'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { Document } from 'langchain/document'
import { createOllamaEmbeddings } from './embeddings'
import { createChromaCollection, DEFAULT_CHROMA_CONFIG } from './chromaClient'
import * as fs from 'fs'
import * as path from 'path'

/**
 * テキストファイルを読み込み、チャンクに分割する
 * @param filePath ファイルパス
 * @param chunkSize チャンクサイズ（デフォルト: 1000）
 * @param chunkOverlap チャンクオーバーラップ（デフォルト: 200）
 * @returns 分割されたドキュメント配列
 */
export async function loadAndSplitDocument(
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
 * ディレクトリ内の全テキストファイルを読み込み、チャンクに分割する
 * @param dirPath ディレクトリパス
 * @param extensions 対象拡張子（デフォルト: ['.txt', '.md']）
 * @param chunkSize チャンクサイズ
 * @param chunkOverlap チャンクオーバーラップ
 * @returns 分割されたドキュメント配列
 */
export async function loadDocumentsFromDirectory(
  dirPath: string,
  extensions: string[] = ['.txt', '.md'],
  chunkSize: number = 1000,
  chunkOverlap: number = 200
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
      console.log(`Loading: ${filePath}`)
      const docs = await loadAndSplitDocument(filePath, chunkSize, chunkOverlap)
      allDocs.push(...docs)
    }
  }

  return allDocs
}

/**
 * ドキュメントをChromaDBに登録する
 * @param dirPath ドキュメントが格納されているディレクトリ
 * @param ollamaUrl Ollama APIのURL
 * @param embeddingModel Embeddingモデル名
 * @param chromaUrl ChromaDB URL
 * @param collectionName コレクション名
 */
export async function loadDocumentsToChroma(
  dirPath: string,
  ollamaUrl: string = 'http://localhost:11434',
  embeddingModel: string = 'nomic-embed-text',
  chromaUrl: string = DEFAULT_CHROMA_CONFIG.url,
  collectionName: string = DEFAULT_CHROMA_CONFIG.collectionName
): Promise<void> {
  console.log('📚 Loading documents from:', dirPath)

  const documents = await loadDocumentsFromDirectory(dirPath)
  console.log(`📄 Loaded ${documents.length} chunks`)

  if (documents.length === 0) {
    throw new Error('No documents found to load')
  }

  console.log('🔄 Creating embeddings with model:', embeddingModel)
  const embeddings = createOllamaEmbeddings(ollamaUrl, embeddingModel)

  console.log('💾 Storing in ChromaDB collection:', collectionName)
  await createChromaCollection(documents, embeddings, {
    collectionName,
    url: chromaUrl,
  })

  console.log('✅ Documents loaded successfully!')
}
