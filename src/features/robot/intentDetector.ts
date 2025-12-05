// ETごっこトリガーのキーワード
const ET_TRIGGER_KEYWORDS = [
  'ETごっこ',
  'etごっこ',
  'イーティーごっこ',
  'ET ごっこ',
  '指タッチ',
  'ロボットとタッチ',
]

export interface IntentResult {
  intent: 'et_gokko' | 'general'
  confidence: number
  originalMessage: string
}

export function detectIntent(message: string): IntentResult {
  // 半角スペースと全角スペース（U+3000）の両方を除去
  const normalizedMessage = message.toLowerCase().replace(/[\s\u3000]+/g, '')

  for (const keyword of ET_TRIGGER_KEYWORDS) {
    const normalizedKeyword = keyword.toLowerCase().replace(/[\s\u3000]+/g, '')
    if (normalizedMessage.includes(normalizedKeyword)) {
      return {
        intent: 'et_gokko',
        confidence: 1.0,
        originalMessage: message,
      }
    }
  }

  return {
    intent: 'general',
    confidence: 1.0,
    originalMessage: message,
  }
}
