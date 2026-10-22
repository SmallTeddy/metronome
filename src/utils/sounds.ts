export interface SoundPreset {
  id: string
  name: string
  strongFreq: number
  weakFreq: number
  subFreq: number
  type: OscillatorType
  decay: number
}

/** 三种音色预设：经典木鱼、电子滴答、机械节拍（全部由 Oscillator + GainNode 合成） */
export const SOUND_PRESETS: SoundPreset[] = [
  { id: 'woodblock', name: '木鱼', strongFreq: 1000, weakFreq: 780, subFreq: 1450, type: 'triangle', decay: 0.12 },
  { id: 'tick', name: '电子滴答', strongFreq: 1250, weakFreq: 900, subFreq: 1650, type: 'square', decay: 0.05 },
  { id: 'mechanical', name: '机械节拍', strongFreq: 950, weakFreq: 680, subFreq: 1200, type: 'sine', decay: 0.09 }
]
