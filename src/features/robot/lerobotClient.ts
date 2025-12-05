export interface LeRobotConfig {
  serverUrl: string
  policyPath: string
}

export interface TriggerResponse {
  success: boolean
  message: string
  taskId?: string
}

const DEFAULT_CONFIG: LeRobotConfig = {
  serverUrl: process.env.LEROBOT_SERVER_URL || 'http://localhost:8080',
  policyPath: process.env.LEROBOT_POLICY_PATH || './finger_touch_policy',
}

const LEROBOT_TIMEOUT_MS = 10000 // 10秒タイムアウト

export async function triggerFingerTouch(
  config: LeRobotConfig = DEFAULT_CONFIG
): Promise<TriggerResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), LEROBOT_TIMEOUT_MS)

  try {
    const response = await fetch(`${config.serverUrl}/api/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'finger_touch',
        policyPath: config.policyPath,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`LeRobot server error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    const isTimeout = error instanceof Error && error.name === 'AbortError'
    console.error('LeRobot trigger failed:', isTimeout ? 'Timeout' : error)
    return {
      success: false,
      message: isTimeout
        ? 'LeRobot server timeout'
        : error instanceof Error
          ? error.message
          : 'Unknown error',
    }
  }
}

// モック用（実機がないとき）
export async function triggerFingerTouchMock(): Promise<TriggerResponse> {
  console.log('[MOCK] LeRobot finger touch triggered')
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return {
    success: true,
    message: '[MOCK] Finger touch action completed',
    taskId: `mock-${Date.now()}`,
  }
}
