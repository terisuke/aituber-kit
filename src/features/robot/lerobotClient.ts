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

export async function triggerFingerTouch(
  config: LeRobotConfig = DEFAULT_CONFIG
): Promise<TriggerResponse> {
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
    })

    if (!response.ok) {
      throw new Error(`LeRobot server error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('LeRobot trigger failed:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
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
