<script setup lang="ts">
import { useMetronomeStore } from '../stores/metronome'
import { SUBDIVISIONS, TIME_SIGNATURES } from '../utils/constants'

const store = useMetronomeStore()

const accentBeats = (): number[] => Array.from({ length: store.beats }, (_, i) => i)
</script>

<template>
  <div class="ts-picker">
    <div class="ts-row">
      <span class="row-label">拍号</span>
      <div class="chips">
        <button
          v-for="ts in TIME_SIGNATURES"
          :key="ts.label"
          class="chip"
          :class="{ active: store.beats === ts.beats && store.unit === ts.unit }"
          @click="store.setTimeSignature(ts.beats, ts.unit)"
        >
          {{ ts.label }}
        </button>
      </div>
    </div>

    <div class="ts-row">
      <span class="row-label">细分</span>
      <div class="chips">
        <button
          v-for="s in SUBDIVISIONS"
          :key="s.id"
          class="chip"
          :class="{ active: store.subdivisionId === s.id }"
          @click="store.setSubdivision(s.id)"
        >
          {{ s.symbol }} {{ s.label }}
        </button>
      </div>
    </div>

    <div v-if="store.beats > 1" class="ts-row">
      <span class="row-label">重音</span>
      <div class="chips">
        <button
          v-for="b in accentBeats()"
          :key="b"
          class="chip accent"
          :class="{ active: store.accents.includes(b) }"
          @click="store.toggleAccent(b)"
        >
          第{{ b + 1 }}拍
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ts-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ts-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.row-label {
  flex: 0 0 44px;
  padding-top: 13px;
  color: var(--text-dim);
  font-size: 13px;
  font-weight: 700;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.chip {
  min-height: 42px;
  padding: 0 14px;
  border-radius: 11px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-dim);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.chip.accent.active {
  background: var(--strong);
  border-color: var(--strong);
}
</style>
