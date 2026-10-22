interface WakeLockSentinelLike {
  release: () => Promise<void>
}

/** 屏幕常亮（Wake Lock API），失败时静默降级 */
export function useWakeLock() {
  let lock: WakeLockSentinelLike | null = null

  function supported(): boolean {
    return 'wakeLock' in navigator
  }

  async function acquire(): Promise<boolean> {
    if (!supported()) return false
    if (lock) return true
    try {
      const api = (navigator as unknown as {
        wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> }
      }).wakeLock
      lock = await api!.request('screen')
      return true
    } catch {
      lock = null
      return false
    }
  }

  async function release() {
    if (!lock) return
    try {
      await lock.release()
    } catch {
      /* 已释放则忽略 */
    }
    lock = null
  }

  async function reacquire() {
    if (lock) return
    await acquire()
  }

  return { supported, acquire, release, reacquire }
}
