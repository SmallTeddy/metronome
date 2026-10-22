import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import {
  BPM_MAX,
  BPM_MIN,
  STORAGE_KEY,
  SUBDIVISIONS,
  type SubdivisionId
} from '../utils/constants'
import { SOUND_PRESETS } from '../utils/sounds'

export type TransportState = 'stopped' | 'playing' | 'paused'
export type ThemeMode = 'dark' | 'light'

export interface SavedPreset {
  id: string
  name: string
  bpm: number
  beats: number
  unit: number
  subdivisionId: SubdivisionId
  accents: number[]
  soundId: string
  volume: number
  subVolume: number
}

interface BeatEvent {
  position: number
  beat: number
  isStrong: boolean
  isSubdivision: boolean
}

export interface PersistedState {
  bpm: number
  beats: number
  unit: number
  subdivisionId: SubdivisionId
  accents: number[]
  soundId: string
  volume: number
  subVolume: number
  muted: boolean
  theme: ThemeMode
  settings: {
    subdivision: boolean
    flash: boolean
    vibration: boolean
    wakeLock: boolean
  }
  presets: SavedPreset[]
}

function clampBpm(value: number): number {
  if (!Number.isFinite(value)) return 120
  return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(value)))
}

function defaultState(): PersistedState {
  return {
    bpm: 120,
    beats: 4,
    unit: 4,
    subdivisionId: 'quarter',
    accents: [0],
    soundId: 'woodblock',
    volume: 80,
    subVolume: 50,
    muted: false,
    theme: 'dark',
    settings: { subdivision: true, flash: true, vibration: true, wakeLock: true },
    presets: []
  }
}

function loadPersisted(): PersistedState {
  const base = defaultState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    return {
      ...base,
      ...parsed,
      bpm: clampBpm(parsed.bpm ?? base.bpm),
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      presets: Array.isArray(parsed.presets) ? parsed.presets : []
    }
  } catch {
    return base
  }
}

let idSeq = 0
function makeId(): string {
  idSeq += 1
  return `preset-${Date.now().toString(36)}-${idSeq}`
}

export const useMetronomeStore = defineStore('metronome', () => {
  const initial = loadPersisted()

  // ---- 持久化状态 ----
  const bpm = ref(initial.bpm)
  const beats = ref(initial.beats)
  const unit = ref(initial.unit)
  const subdivisionId = ref<SubdivisionId>(initial.subdivisionId)
  const accents = ref<number[]>(initial.accents)
  const soundId = ref(initial.soundId)
  const volume = ref(initial.volume)
  const subVolume = ref(initial.subVolume)
  const muted = ref(initial.muted)
  const theme = ref<ThemeMode>(initial.theme)
  const settings = ref<PersistedState['settings']>(initial.settings)
  const presets = ref<SavedPreset[]>(initial.presets)

  // ---- 运行时状态（由音频引擎驱动） ----
  const transport = ref<TransportState>('stopped')
  const currentBeat = ref(0)
  const currentPosition = ref(0)
  const isStrong = ref(true)
  const errorMsg = ref('')

  const subdivision = computed(() => SUBDIVISIONS.find((s) => s.id === subdivisionId.value) ?? SUBDIVISIONS[0])
  const subdivisionFactor = computed(() => subdivision.value.factor)
  const positionsPerMeasure = computed(() => beats.value * subdivisionFactor.value)
  const currentSound = computed(() => SOUND_PRESETS.find((s) => s.id === soundId.value) ?? SOUND_PRESETS[0])

  function persist() {
    const data: PersistedState = {
      bpm: bpm.value,
      beats: beats.value,
      unit: unit.value,
      subdivisionId: subdivisionId.value,
      accents: accents.value,
      soundId: soundId.value,
      volume: volume.value,
      subVolume: subVolume.value,
      muted: muted.value,
      theme: theme.value,
      settings: { ...settings.value },
      presets: presets.value
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* 隐私模式等场景忽略 */
    }
  }

  // ---- 动作 ----
  function setBpm(value: number) {
    bpm.value = clampBpm(value)
  }

  function adjustBpm(delta: number) {
    bpm.value = clampBpm(bpm.value + delta)
  }

  function setTimeSignature(b: number, u: number) {
    beats.value = b
    unit.value = u
    // 保证重音下标不越界
    accents.value = accents.value.filter((a) => a < b)
    if (!accents.value.includes(0)) accents.value = [0]
  }

  function setSubdivision(id: SubdivisionId) {
    subdivisionId.value = id
  }

  function toggleAccent(beatIndex: number) {
    const list = [...accents.value]
    const idx = list.indexOf(beatIndex)
    if (idx >= 0) {
      list.splice(idx, 1)
      if (list.length === 0) list.push(0) // 至少保留一个强拍
    } else {
      list.push(beatIndex)
      list.sort((a, b) => a - b)
    }
    accents.value = list
  }

  function setSound(id: string) {
    soundId.value = id
  }

  function setVolume(v: number) {
    volume.value = Math.min(100, Math.max(0, Math.round(v)))
  }

  function setSubVolume(v: number) {
    subVolume.value = Math.min(100, Math.max(0, Math.round(v)))
  }

  function toggleMute() {
    muted.value = !muted.value
  }

  function setTheme(mode: ThemeMode) {
    theme.value = mode
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function updateSetting(key: keyof PersistedState['settings'], value: boolean) {
    settings.value = { ...settings.value, [key]: value }
  }

  function savePreset(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const preset: SavedPreset = {
      id: makeId(),
      name: trimmed,
      bpm: bpm.value,
      beats: beats.value,
      unit: unit.value,
      subdivisionId: subdivisionId.value,
      accents: [...accents.value],
      soundId: soundId.value,
      volume: volume.value,
      subVolume: subVolume.value
    }
    presets.value = [...presets.value, preset]
  }

  function deletePreset(id: string) {
    presets.value = presets.value.filter((p) => p.id !== id)
  }

  function applyPreset(preset: SavedPreset) {
    bpm.value = clampBpm(preset.bpm)
    beats.value = preset.beats
    unit.value = preset.unit
    subdivisionId.value = preset.subdivisionId
    accents.value = preset.accents
    soundId.value = preset.soundId
    volume.value = preset.volume
    subVolume.value = preset.subVolume
  }

  // 由音频引擎的调度回调调用（每拍一次），驱动视觉反馈
  function applyBeat(event: BeatEvent) {
    currentPosition.value = event.position
    currentBeat.value = event.beat
    isStrong.value = event.isStrong
    if (event.isStrong && settings.value.vibration && 'vibrate' in navigator) {
      navigator.vibrate?.(30)
    }
  }

  function setTransport(s: TransportState) {
    transport.value = s
  }

  function resetTransport() {
    transport.value = 'stopped'
    currentBeat.value = 0
    currentPosition.value = 0
    isStrong.value = true
  }

  function setError(msg: string) {
    errorMsg.value = msg
  }

  // 任一配置变化都持久化
  watch(
    [bpm, beats, unit, subdivisionId, accents, soundId, volume, subVolume, muted, theme, settings, presets],
    () => persist(),
    { deep: true }
  )

  return {
    // 状态
    bpm,
    beats,
    unit,
    subdivisionId,
    accents,
    soundId,
    volume,
    subVolume,
    muted,
    theme,
    settings,
    presets,
    transport,
    currentBeat,
    currentPosition,
    isStrong,
    errorMsg,
    // 派生
    subdivision,
    subdivisionFactor,
    positionsPerMeasure,
    currentSound,
    // 动作
    setBpm,
    adjustBpm,
    setTimeSignature,
    setSubdivision,
    toggleAccent,
    setSound,
    setVolume,
    setSubVolume,
    toggleMute,
    setTheme,
    toggleTheme,
    updateSetting,
    savePreset,
    deletePreset,
    applyPreset,
    applyBeat,
    setTransport,
    resetTransport,
    setError,
    persist
  }
})
