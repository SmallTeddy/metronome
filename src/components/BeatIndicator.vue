<script setup lang="ts">
import { computed } from 'vue'
import { useMetronomeStore } from '../stores/metronome'

const store = useMetronomeStore()

const beatsList = computed(() => Array.from({ length: store.beats }, (_, i) => i))

// 细分进度：当前拍内的位置（0 为强拍主位）
const subProgress = computed(() => store.currentPosition % store.subdivisionFactor)
</script>

<template>
  <div class="beat-indicator">
    <div
      v-if="store.settings.flash"
      class="breathing"
      aria-hidden="true"
      :style="{ animationDuration: 60 / store.bpm + 's' }"
    />
    <div class="dots">
      <div
        v-for="b in beatsList"
        :key="b"
        class="dot"
        :class="{
          active: b === store.currentBeat,
          strong: store.accents.includes(b),
          sub: b === store.currentBeat && subProgress > 0
        }"
      >
        <span v-if="b === store.currentBeat" class="beat-label">{{ b + 1 }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.beat-indicator {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 76px;
}

.breathing {
  position: absolute;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  opacity: 0;
  animation-name: breathe;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  pointer-events: none;
}

@keyframes breathe {
  0% {
    transform: scale(0.55);
    opacity: 0.7;
  }
  10% {
    transform: scale(0.72);
    opacity: 0;
  }
  100% {
    transform: scale(0.55);
    opacity: 0.7;
  }
}

.dots {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--muted-bg);
  border: 2px solid var(--border);
  display: grid;
  place-items: center;
  transition:
    transform 0.1s ease-out,
    background 0.1s,
    border-color 0.1s,
    box-shadow 0.1s;
}

.dot.strong {
  background: transparent;
  border-color: var(--strong);
}

.dot.strong.active {
  background: var(--strong);
  border-color: var(--strong);
  box-shadow: 0 0 22px color-mix(in srgb, var(--strong) 60%, transparent);
  transform: scale(1.35);
}

.dot:not(.strong).active {
  background: var(--weak);
  border-color: var(--weak);
  box-shadow: 0 0 22px color-mix(in srgb, var(--weak) 60%, transparent);
  transform: scale(1.35);
}

.dot.sub {
  opacity: 0.6;
  transform: scale(0.8);
}

.beat-label {
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}
</style>
