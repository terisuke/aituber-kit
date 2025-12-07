import { detectIntent } from '../intentDetector'

describe('detectIntent', () => {
  // 開始キーワードテスト
  describe('et_gokko intent (start)', () => {
    const startKeywords = [
      'ETごっこ',
      'etごっこ',
      'イーティーごっこ',
      'ET ごっこ',
      '指タッチ',
      'ロボットとタッチ',
      'テレオペ開始',
      'テレオペレーション開始',
      'ロボット操作開始',
    ]

    startKeywords.forEach((keyword) => {
      it(`should detect "${keyword}" as et_gokko`, () => {
        const result = detectIntent(keyword)
        expect(result.intent).toBe('et_gokko')
        expect(result.confidence).toBe(1.0)
      })
    })

    it('should detect keyword in sentence', () => {
      const result = detectIntent('ねえ、ETごっこしようよ!')
      expect(result.intent).toBe('et_gokko')
    })
  })

  // 停止キーワードテスト
  describe('teleop_stop intent', () => {
    const stopKeywords = [
      'テレオペ停止',
      'テレオペレーション停止',
      'テレオペ終了',
      'テレオペレーション終了',
      'ロボット操作停止',
      'ロボット操作終了',
      'ロボット止めて',
      'ロボットストップ',
    ]

    stopKeywords.forEach((keyword) => {
      it(`should detect "${keyword}" as teleop_stop`, () => {
        const result = detectIntent(keyword)
        expect(result.intent).toBe('teleop_stop')
        expect(result.confidence).toBe(1.0)
      })
    })
  })

  // 一般メッセージテスト
  describe('general intent', () => {
    it('should detect normal message as general', () => {
      const result = detectIntent('今日の天気はどうですか?')
      expect(result.intent).toBe('general')
    })

    it('should detect greeting as general', () => {
      const result = detectIntent('こんにちは')
      expect(result.intent).toBe('general')
    })
  })
})
