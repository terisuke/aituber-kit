/**
 * テレオペレーション管理モジュール（サーバーサイド専用）
 * child_processを使用するためAPIルートでのみインポート可能
 * PIDファイルベースの永続的な状態管理を使用
 */
import { spawn, execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

export interface TeleopConfig {
  condaEnv: string
  lerobotPath: string
  followerPort: string
  followerId: string
  leaderPort: string
  leaderId: string
}

export interface TeleopResponse {
  success: boolean
  message: string
  pid?: number
}

const DEFAULT_TELEOP_CONFIG: TeleopConfig = {
  condaEnv: process.env.LEROBOT_CONDA_ENV || 'lerobot',
  lerobotPath:
    process.env.LEROBOT_PATH || '/Users/teradakousuke/Developer/lerobot',
  followerPort:
    process.env.LEROBOT_FOLLOWER_PORT || '/dev/tty.wchusbserial5AB90691861',
  followerId: process.env.LEROBOT_FOLLOWER_ID || 'my_awesome_follower_arm',
  leaderPort:
    process.env.LEROBOT_LEADER_PORT || '/dev/tty.wchusbserial5AB90684961',
  leaderId: process.env.LEROBOT_LEADER_ID || 'my_awesome_leader_arm',
}

// PIDファイルのパス
const PID_FILE = '/tmp/lerobot-teleop.pid'

/**
 * PIDファイルからプロセスIDを読み取る
 */
function readPidFile(): number | null {
  try {
    if (fs.existsSync(PID_FILE)) {
      const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10)
      return isNaN(pid) ? null : pid
    }
  } catch {
    // ファイル読み取りエラーは無視
  }
  return null
}

/**
 * PIDファイルにプロセスIDを書き込む
 */
function writePidFile(pid: number): void {
  fs.writeFileSync(PID_FILE, pid.toString())
}

/**
 * PIDファイルを削除
 */
function removePidFile(): void {
  try {
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE)
    }
  } catch {
    // 削除エラーは無視
  }
}

/**
 * プロセスが実行中かどうかを確認
 */
function isProcessRunning(pid: number): boolean {
  try {
    // シグナル0を送信してプロセスの存在を確認
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/**
 * テレオペレーションを開始
 * conda環境でlerobot-teleoperateコマンドを実行
 */
export async function startTeleoperation(
  config: TeleopConfig = DEFAULT_TELEOP_CONFIG
): Promise<TeleopResponse> {
  // 既存のPIDファイルをチェック
  const existingPid = readPidFile()
  if (existingPid && isProcessRunning(existingPid)) {
    return {
      success: false,
      message: 'Teleoperation is already running',
      pid: existingPid,
    }
  }

  // 古いPIDファイルがあれば削除
  removePidFile()

  const command = `source ~/.zshrc && conda activate ${config.condaEnv} && cd ${config.lerobotPath} && lerobot-teleoperate --robot.type=so101_follower --robot.port=${config.followerPort} --robot.id=${config.followerId} --robot.cameras="{}" --teleop.type=so101_leader --teleop.port=${config.leaderPort} --teleop.id=${config.leaderId} --display_data=true`

  console.log('[LeRobot] Starting teleoperation...')
  console.log('[LeRobot] Command:', command)

  return new Promise((resolve) => {
    try {
      const teleopProcess = spawn('zsh', ['-c', command], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      const pid = teleopProcess.pid

      if (pid) {
        // PIDファイルに保存
        writePidFile(pid)
      }

      teleopProcess.stdout?.on('data', (data) => {
        console.log(`[LeRobot stdout] ${data}`)
      })

      teleopProcess.stderr?.on('data', (data) => {
        console.error(`[LeRobot stderr] ${data}`)
      })

      teleopProcess.on('error', (error) => {
        console.error('[LeRobot] Process error:', error)
        removePidFile()
      })

      teleopProcess.on('exit', (code) => {
        console.log(`[LeRobot] Process exited with code ${code}`)
        removePidFile()
      })

      // 親プロセスから切り離す
      teleopProcess.unref()

      // プロセスが起動したことを確認するため少し待つ
      setTimeout(() => {
        if (pid && isProcessRunning(pid)) {
          resolve({
            success: true,
            message: 'Teleoperation started successfully',
            pid: pid,
          })
        } else {
          removePidFile()
          resolve({
            success: false,
            message: 'Failed to start teleoperation process',
          })
        }
      }, 1000)
    } catch (error) {
      console.error('[LeRobot] Failed to start:', error)
      removePidFile()
      resolve({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })
}

/**
 * テレオペレーションを停止
 */
export async function stopTeleoperation(): Promise<TeleopResponse> {
  const pid = readPidFile()

  if (!pid || !isProcessRunning(pid)) {
    removePidFile()
    return {
      success: false,
      message: 'No teleoperation process is running',
    }
  }

  try {
    // プロセスグループ全体を終了（-pid でグループ指定）
    process.kill(-pid, 'SIGTERM')
    removePidFile()

    console.log('[LeRobot] Teleoperation stopped')
    return {
      success: true,
      message: 'Teleoperation stopped successfully',
      pid: pid,
    }
  } catch (error) {
    console.error('[LeRobot] Failed to stop:', error)
    // プロセスが見つからない場合はPIDファイルを削除
    removePidFile()
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * テレオペレーションの状態を取得
 */
export function getTeleopStatus(): {
  running: boolean
  pid?: number
} {
  const pid = readPidFile()

  if (pid && isProcessRunning(pid)) {
    return {
      running: true,
      pid: pid,
    }
  }

  // プロセスが実行中でなければPIDファイルを削除
  if (pid) {
    removePidFile()
  }

  return {
    running: false,
  }
}
