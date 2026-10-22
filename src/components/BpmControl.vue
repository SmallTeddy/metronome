<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useMetronomeStore } from '../stores/metronome'
import { BPM_MAX, BPM_MIN } from '../utils/constants'

const store = useMetronomeStore()

const editing = ref(false)
const draft = ref('120')
const pulse = ref(0)

// 长按连续调节
let repeatTimer: number | null = null
let stepDir = 0

function hold(dir: 1 | -1) {
  stopHold()
  store.adjustBpm(dir)
  stepDir = dir
  repeatTimer = window.setInterval(() => store.adjustBpm(dir), 120)
}

function stopHold() {
  stepDir = 0
  if (repeatTimer !== null) {
    window.clearInterval(repeatTimer)
    repeatTimer = null
  }
}

function startEdit() {
  draft.value = String(store.bpm)
  editing.value = true
}

function commitEdit() {
  editing.value = false
  const value = Number(draft.value)
  if (Number.isFinite(value) && value >= BPM_MIN && value <= BPM_MAX) {
    store.setBpm(value)
  }
  // 非法值回退为当前 BPM
}

// Tap Tempo：连续点击，取最近 4-6 次间隔平均值；间隔超过 2s 重置
const tapTimes: number[] = []
const tapBpm = ref<number | null>(null)
let tapFadeTimer: number | null = null

function onTap() {
  const now = performance.now()
  if (tapTimes.length > 0 && now - tapTimes[tapTimes.length - 1] > 2000) {
    tapTimes.length = 0
  }
  tapTimes.push(now)
  if (tapTimes.length > 6) tapTimes.shift()
  if (tapTimes.length >= 3) {
    const intervals: number[] = []
    for (let i = 1; i < tapTimes.length; i++) {
      intervals.push(tapTimes[i] - tapTimes[i - 1])
    }
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const bpmVal = Math.round(60000 / avg)
    if (bpmVal >= BPM_MIN && bpmVal <= BPM_MAX) {
      store.setBpm(bpmVal)
      tapBpm.value = bpmVal
    }
  }
  if (tapFadeTimer !== null) window.clearTimeout(tapFadeTimer)
  tapFadeTimer = window.setTimeout(() => {
    tapBpm.value = null
  }, 1500)
}

// BPM 数字随节拍轻微脉冲
let lastBeat = -1
watch(
  () => store.currentBeat,
  (beat) => {
    if (beat !== lastBeat) {
      lastBeat = beat
      pulse.value = beat
    }
  }
)

onBeforeUnmount(() => {
  stopHold()
  if (tapFadeTimer !== null) window.clearTimeout(tapFadeTimer)
})
</script>

<template>
  <div class="bpm-control">
    <button
      class="bpm-btn minus"
      aria-label="降低速度"
      @pointerdown="hold(-1)"
      @pointerup="stopHold"
      @pointerleave="stopHold"
      @pointercancel="stopHold"
      @contextmenu.prevent
    >
      −
    </button>

    <div class="bpm-display">
      <span class="bpm-symbol" aria-hidden="true">♩ =</span>
      <template v-if="editing">
        <input
          v-model="draft"
          class="bpm-input"
          type="number"
          :min="BPM_MIN"
          :max="BPM_MAX"
          inputmode="numeric"
          @blur="commitEdit"
          @keydown.enter="commitEdit"
        />
      </template>
      <template v-else>
        <div
          v-if="store.settings.flash"
          :key="'p' + pulse"
          class="bpm-number pulsing"
          :style="{ animationDuration: 60 / store.bpm + 's' }"
          @click="startEdit"
        >
          {{ store.bpm }}
        </div>
        <div v-else :key="'s'" class="bpm-number" @click="startEdit">
          {{ store.bpm }}
        </div>
      </template>
      <span class="bpm-unit">BPM</span>
      <span v-if="tapBpm" class="tap-hint">TAP {{ tapBpm }}</span>
    </div>

    <button
      class="bpm-btn plus"
      aria-label="提高速度"
      @pointerdown="hold(1)"
      @pointerup="stopHold"
      @pointerleave="stopHold"
      @pointercancel="stopHold"
      @contextmenu.prevent
    >
      ＋
    </button>

    <input
      class="bpm-slider"
      type="range"
      :min="BPM_MIN"
      :max="BPM_MAX"
      step="1"
      :value="store.bpm"
      aria-label="速度滑杆"
      @input="store.setBpm(Number(($event.target as HTMLInputElement).value))"
    />

    <button class="tap-btn" @click="onTap">TAP 定速</button>
  </div>
</template>

<style scoped>
.bpm-control {
  display: grid;
  grid-template-columns: 64px 1fr 64px;
  grid-template-rows: auto auto auto;
  gap: 12px;
  align-items: center;
}

.bpm-btn {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  border: none;
  background: var(--surface-2);
  color: var(--text);
  font-size: 30px;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  transition: transform 0.08s;
}

.bpm-btn:active {
  transform: scale(0.92);
  background: var(--accent);
  color: #fff;
}

.minus {
  grid-column: 1;
  grid-row: 1 / 3;
  align-self: center;
}

.plus {
  grid-column: 3;
  grid-row: 1 / 3;
  align-self: center;
}

.bpm-display {
  grid-column: 2;
  grid-row: 1 / 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  position: relative;
}

.bpm-symbol {
  color: var(--text-dim);
  font-size: 14px;
}

.bpm-number {
  font-size: 74px;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

@keyframes beatPulse {
  0% {
    transform: scale(1);
  }
  6% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}

.pulsing {
  animation-name: beatPulse;
  animation-timing-function: ease-out;
  animation-iteration-count: infinite;
}

.bpm-unit {
  color: var(--text-dim);
  font-size: 13px;
  letter-spacing: 3px;
}

.tap-hint {
  position: absolute;
  top: 0;
  right: 6px;
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  padding: 2px 8px;
}

.bpm-input {
  width: 150px;
  text-align: center;
  font-size: 60px;
  font-weight: 800;
  background: transparent;
  border: none;
  border-bottom: 2px solid var(--accent);
  color: var(--text);
  outline: none;
  -moz-appearance: textfield;
}

.bpm-input::-webkit-outer-spin-button,
.bpm-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.bpm-slider {
  grid-column: 1 / 4;
  width: 100%;
  accent-color: var(--accent);
  height: 44px;
}

.tap-btn {
  grid-column: 1 / 4;
  min-height: 48px;
  border-radius: 14px;
  border: 1px dashed var(--border);
  background: var(--surface-2);
  color: var(--text-dim);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  touch-action: manipulation;
}

.tap-btn:active {
  color: var(--text);
  border-color: var(--accent);
}
</style>
