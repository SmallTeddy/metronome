export interface TimeSignature {
  beats: number
  unit: number
  label: string
}

export const TIME_SIGNATURES: TimeSignature[] = [
  { beats: 1, unit: 4, label: '1/4' },
  { beats: 2, unit: 4, label: '2/4' },
  { beats: 3, unit: 4, label: '3/4' },
  { beats: 4, unit: 4, label: '4/4' },
  { beats: 6, unit: 8, label: '6/8' },
  { beats: 3, unit: 8, label: '3/8' }
]

export type SubdivisionId = 'quarter' | 'eighth' | 'sixteenth' | 'triplet'

export interface Subdivision {
  id: SubdivisionId
  label: string
  symbol: string
  factor: number
}

export const SUBDIVISIONS: Subdivision[] = [
  { id: 'quarter', label: '四分音符', symbol: '♩', factor: 1 },
  { id: 'eighth', label: '八分音符', symbol: '♪', factor: 2 },
  { id: 'sixteenth', label: '十六分音符', symbol: '♬', factor: 4 },
  { id: 'triplet', label: '三连音', symbol: '⅓', factor: 3 }
]

export const BPM_MIN = 30
export const BPM_MAX = 300

export interface TempoTerm {
  name: string
  bpm: number
}

export const TEMPO_TERMS: TempoTerm[] = [
  { name: 'Largo', bpm: 50 },
  { name: 'Andante', bpm: 80 },
  { name: 'Moderato', bpm: 100 },
  { name: 'Allegro', bpm: 120 },
  { name: 'Presto', bpm: 180 }
]

export const STORAGE_KEY = 'metronome:v1'
