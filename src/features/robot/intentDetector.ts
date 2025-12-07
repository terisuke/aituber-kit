// ETごっこ（テレオペレーション開始）トリガーのキーワード
const ET_TRIGGER_KEYWORDS = [
  'ETごっこ',
  'etごっこ',
  'イーティーごっこ',
  'ET ごっこ',
  '指タッチ',
  'ロボットとタッチ',
  'テレオペ開始',
  'テレオペレーション開始',
  'テレオペレート開始',
  'ロボット操作開始',
]

// テレオペレーション停止のキーワード
const TELEOP_STOP_KEYWORDS = [
  'テレオペ停止',
  'テレオペレーション停止',
  'テレオペ終了',
  'テレオペレーション終了',
  'ロボット操作停止',
  'ロボット操作終了',
  'ロボット止めて',
  'ロボットストップ',
]

export interface IntentResult {
  intent: 'et_gokko' | 'teleop_stop' | 'general'
  confidence: number
  originalMessage: string
}

export function detectIntent(message: string): IntentResult {
  // 半角スペースと全角スペース（U+3000）の両方を除去
  const normalizedMessage = message.toLowerCase().replace(/[\s\u3000]+/g, '')

  // 停止キーワードを先にチェック
  for (const keyword of TELEOP_STOP_KEYWORDS) {
    const normalizedKeyword = keyword.toLowerCase().replace(/[\s\u3000]+/g, '')
    if (normalizedMessage.includes(normalizedKeyword)) {
      return {
        intent: 'teleop_stop',
        confidence: 1.0,
        originalMessage: message,
      }
    }
  }

  // 開始キーワードをチェック
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
