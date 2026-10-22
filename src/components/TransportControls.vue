<script setup lang="ts">
import { ref } from 'vue'
import { useMetronomeStore } from '../stores/metronome'

const emit = defineEmits<{
  toggleMain: []
  pause: []
  reset: []
}>()

const store = useMetronomeStore()

let lastStopTap = 0

function onMain() {
  if (store.transport === 'playing') {
    // 双击停止：回到第 1 拍
    const now = performance.now()
    if (now - lastStopTap < 300) {
      lastStopTap = 0
      emit('reset')
      return
    }
    lastStopTap = now
    emit('toggleMain')
  } else {
    emit('toggleMain')
  }
}
</script>

<template>
  <div class="transport">
    <button
      class="pause-btn"
      :class="{ hidden: store.transport !== 'playing' }"
      aria-label="暂停 / 继续"
      @click="emit('pause')"
    >
      ❚❚
    </button>

    <button
      class="main-btn"
      :class="{
        playing: store.transport === 'playing',
        paused: store.transport === 'paused'
      }"
      :aria-label="store.transport === 'playing' ? '停止' : '开始'"
      @click="onMain"
    >
      <span v-if="store.transport === 'playing'" class="stop-icon">■</span>
      <span v-else-if="store.transport === 'paused'" class="play-icon">▶</span>
      <span v-else class="play-icon">▶</span>
    </button>

    <div class="state-label">
      {{ store.transport === 'playing' ? '播放中 · 双击停止回到第 1 拍' : store.transport === 'paused' ? '已暂停' : '停止' }}
    </div>
  </div>
</template>

<style scoped>
.transport {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.main-btn {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(145deg, #22d3ee, #0284c7);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow:
    0 10px 30px color-mix(in srgb, var(--accent) 45%, transparent),
    inset 0 2px 2px rgb(255 255 255 / 25%);
  transition: transform 0.1s;
}

.main-btn:active {
  transform: scale(0.94);
}

.main-btn.playing {
  background: linear-gradient(145deg, #f87171, #dc2626);
  box-shadow: 0 10px 30px color-mix(in srgb, var(--strong) 45%, transparent);
}

.main-btn.paused {
  background: linear-gradient(145deg, #fbbf24, #f59e0b);
}

.play-icon {
  font-size: 40px;
  margin-left: 4px;
}

.stop-icon {
  font-size: 34px;
}

.pause-btn {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  font-size: 16px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition:
    opacity 0.2s,
    transform 0.1s;
}

.pause-btn.hidden {
  opacity: 0;
  pointer-events: none;
  position: absolute;
}

.pause-btn:active {
  transform: scale(0.92);
}

.state-label {
  color: var(--text-dim);
  font-size: 12px;
  letter-spacing: 0.5px;
}
</style>
