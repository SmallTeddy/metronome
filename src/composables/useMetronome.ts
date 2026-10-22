import { ref } from 'vue'
import { SOUND_PRESETS } from '../utils/sounds'
import type { TransportState } from '../stores/metronome'

export interface MetronomeConfig {
  bpm: number
  beatsPerMeasure: number
  subdivisionFactor: number
  subdivisionEnabled: boolean
  accents: number[]
  volume: number
  subVolume: number
  muted: boolean
  soundId: string
}

export interface BeatEvent {
  position: number
  beat: number
  isStrong: boolean
  isSubdivision: boolean
}

/**
 * 基于 Web Audio API 的「Ahead-of-time 调度器」（参考 Chris Wilson "A Tale of Two Clocks"）：
 * - 时间基准为 AudioContext.currentTime，禁止用 setInterval 直接驱动节拍；
 * - setInterval 每 25ms 检查一次，提前调度未来 100ms 内的所有节拍；
 * - 音频调度与 UI 渲染解耦，UI 通过 onBeat 回调驱动。
 */
export function useMetronome(
  getConfig: () => MetronomeConfig,
  onBeat: (event: BeatEvent) => void,
  onError: (msg: string) => void
) {
  const state = ref<TransportState>('stopped')

  const LOOKAHEAD_MS = 25
  const SCHEDULE_AHEAD_S = 0.1
  const ENVELOPE_ATTACK = 0.005

  let ctx: AudioContext | null = null
  let timer: number | null = null
  let nextTime = 0
  let position = 0

  /** 首拍唤醒：iOS 需用户手势激活 AudioContext */
  function ensureAudio(): AudioContext | null {
    try {
      if (!ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AC) {
          throw new Error('unsupported')
        }
        ctx = new AC()
      }
      if (ctx.state === 'suspended') {
        void ctx.resume().catch(() => {
          onError('音频上下文被挂起，请点击屏幕后再试')
        })
      }
      return ctx
    } catch {
      onError('当前浏览器不支持 Web Audio API，无法发声')
      return null
    }
  }

  /** 合成一个点击声：Oscillator + GainNode，快速 attack + 短 decay 包络 */
  function playClick(when: number, isStrong: boolean, isSubdivision: boolean) {
    if (!ctx) return
    const conf = getConfig()
    if (conf.muted) return
    const preset = SOUND_PRESETS.find((s) => s.id === conf.soundId) ?? SOUND_PRESETS[0]

    const baseVol = isSubdivision ? (conf.volume * conf.subVolume) / 10000 : conf.volume / 100
    const freq = isSubdivision ? preset.subFreq : isStrong ? preset.strongFreq : preset.weakFreq

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = preset.type
    osc.frequency.setValueAtTime(freq, when)

    const peak = Math.min(0.9, Math.max(0.0002, baseVol * 0.8))
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.exponentialRampToValueAtTime(peak, when + ENVELOPE_ATTACK)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + preset.decay)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(when)
    osc.stop(when + preset.decay + 0.02)
  }

  function scheduleLoop() {
    if (!ctx) return
    const conf = getConfig()
    const interval = 60 / conf.bpm / conf.subdivisionFactor
    const horizon = ctx.currentTime + SCHEDULE_AHEAD_S
    while (nextTime < horizon) {
      const pos = position
      const isSub = pos % conf.subdivisionFactor !== 0
      const beat = Math.floor(pos / conf.subdivisionFactor)
      const isStrong = !isSub && conf.accents.includes(beat)

      if (!(isSub && !conf.subdivisionEnabled)) {
        playClick(nextTime, isStrong, isSub)
      }
      onBeat({ position: pos, beat, isStrong, isSubdivision: isSub })

      position = (position + 1) % (conf.beatsPerMeasure * conf.subdivisionFactor)
      nextTime += interval
    }
  }

  function startScheduler() {
    if (!ctx || timer !== null) return
    scheduleLoop()
    timer = window.setInterval(scheduleLoop, LOOKAHEAD_MS)
  }

  function start() {
    if (!ensureAudio()) return
    position = 0
    nextTime = ctx!.currentTime + 0.1
    startScheduler()
    state.value = 'playing'
  }

  function pause() {
    if (timer !== null) {
      window.clearInterval(timer)
      timer = null
    }
    state.value = 'paused'
  }

  /** 暂停/切后台回来后继续：保留当前拍位置，重新锚定时间基准 */
  function resume() {
    if (!ensureAudio()) return
    nextTime = ctx!.currentTime + 0.05
    startScheduler()
    state.value = 'playing'
  }

  function stop() {
    if (timer !== null) {
      window.clearInterval(timer)
      timer = null
    }
    position = 0
    state.value = 'stopped'
  }

  /** 停止时回到第 1 拍（双击停止按钮触发的重置，播放中可安全调用） */
  function resetToFirstBeat() {
    position = 0
  }

  /** 页面切后台：暂停调度器，保持播放状态，回前台后无缝恢复 */
  function suspendOnHidden() {
    if (timer !== null) {
      window.clearInterval(timer)
      timer = null
    }
  }

  function resumeOnVisible() {
    if (state.value !== 'playing' || timer !== null) return
    if (!ensureAudio()) return
    nextTime = ctx!.currentTime + 0.05
    startScheduler()
  }

  function destroy() {
    if (timer !== null) {
      window.clearInterval(timer)
      timer = null
    }
    if (ctx) {
      void ctx.close().catch(() => undefined)
      ctx = null
    }
  }

  return {
    state,
    start,
    pause,
    resume,
    stop,
    resetToFirstBeat,
    suspendOnHidden,
    resumeOnVisible,
    ensureAudio,
    destroy
  }
}
