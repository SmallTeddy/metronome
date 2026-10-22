<script setup lang="ts">
import { ref } from 'vue'
import { useMetronomeStore } from '../stores/metronome'

const emit = defineEmits<{
  toggleMain: []
  pause: []
  reset: []
}>()

const store = useMetronomeStore()

let lastStopTime = 0

function onMain() {
  const now = performance.now()
  if (store.transport === 'playing') {
    // 播放中：单击即停止，并记录时间，供「双击停止」手势判定
    lastStopTime = now
    emit('toggleMain')
  } else {
    // 停止后 300ms 内的点击视为「双击停止」的第二下：保持停止并回到第 1 拍，不要重新开始
    if (now - lastStopTime < 300) {
      lastStopTime = 0
      emit('reset')
      return
    }
    emit('toggleMain')
  }
}
</script>

<template>
  <div class="transport">
    <div class="transport-main">
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
    </div>

    <div class="state-label">
      {{ store.transport === 'playing' ? '播放中 · 双击停止回第 1 拍' : store.transport === 'paused' ? '已暂停' : '停止' }}
    </div>
  </div>
</template>

<style scoped>
.transport {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: 0 0 auto;
}

.transport-main {
  position: relative;
}

.main-btn {
  width: 84px;
  height: 84px;
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
  font-size: 34px;
  margin-left: 4px;
}

.stop-icon {
  font-size: 28px;
}

.pause-btn {
  position: absolute;
  left: -58px;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  font-size: 15px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition:
    opacity 0.2s,
    transform 0.1s;
  z-index: 1;
}

.pause-btn.hidden {
  opacity: 0;
  pointer-events: none;
}

.pause-btn:active {
  transform: translateY(-50%) scale(0.92);
}

.state-label {
  color: var(--text-dim);
  font-size: 11px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

@media (max-height: 640px) {
  .main-btn {
    width: 72px;
    height: 72px;
  }

  .pause-btn {
    width: 42px;
    height: 42px;
    left: -52px;
  }

  .state-label {
    display: none;
  }
}
</style>
