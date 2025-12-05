import { NextApiRequest, NextApiResponse } from 'next'
import {
  triggerFingerTouch,
  triggerFingerTouchMock,
} from '@/features/robot/lerobotClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action } = req.body

  if (action !== 'finger_touch') {
    return res.status(400).json({ error: 'Unknown action' })
  }

  const useMock = process.env.LEROBOT_USE_MOCK === 'true'

  const result = useMock
    ? await triggerFingerTouchMock()
    : await triggerFingerTouch()

  return res.status(result.success ? 200 : 500).json(result)
}
