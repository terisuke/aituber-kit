import { NextApiRequest, NextApiResponse } from 'next'
import {
  triggerFingerTouch,
  triggerFingerTouchMock,
  startTeleoperationMock,
  stopTeleoperationMock,
} from '@/features/robot/lerobotClient'
import {
  startTeleoperation,
  stopTeleoperation,
  getTeleopStatus,
} from '@/lib/teleoperation'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action } = req.body
  const useMock = process.env.LEROBOT_USE_MOCK === 'true'

  switch (action) {
    case 'finger_touch': {
      const result = useMock
        ? await triggerFingerTouchMock()
        : await triggerFingerTouch()
      return res.status(result.success ? 200 : 500).json(result)
    }

    case 'teleop_start': {
      const result = useMock
        ? await startTeleoperationMock()
        : await startTeleoperation()
      return res.status(result.success ? 200 : 500).json(result)
    }

    case 'teleop_stop': {
      const result = useMock
        ? await stopTeleoperationMock()
        : await stopTeleoperation()
      return res.status(result.success ? 200 : 500).json(result)
    }

    case 'teleop_status': {
      const status = getTeleopStatus()
      return res.status(200).json(status)
    }

    default:
      return res.status(400).json({ error: 'Unknown action' })
  }
}
