<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMetronomeStore } from './stores/metronome'
import { useMetronome } from './composables/useMetronome'
import { useWakeLock } from './composables/useWakeLock'
import BpmControl from './components/BpmControl.vue'
import TransportControls from './components/TransportControls.vue'
import BeatIndicator from './components/BeatIndicator.vue'
import TimeSignaturePicker from './components/TimeSignaturePicker.vue'
import PresetManager from './components/PresetManager.vue'
import SettingsPanel from './components/SettingsPanel.vue'

const store = useMetronomeStore()
const wake = useWakeLock()

const engine = useMetronome(
  () => ({
    bpm: store.bpm,
    beatsPerMeasure: store.beats,
    subdivisionFactor: store.subdivisionFactor,
    subdivisionEnabled: store.settings.subdivision,
    accents: store.accents,
    volume: store.volume,
    subVolume: store.subVolume,
    muted: store.muted,
    soundId: store.soundId
  }),
  (event) => store.applyBeat(event),
  (msg) => store.setError(msg)
)

const showSettings = ref(false)

function toggleTheme() {
  store.toggleTheme()
}

// 播放控制
function onToggleMain() {
  const s = store.transport
  if (s === 'playing') {
    engine.stop()
    store.resetTransport()
  } else if (s === 'paused') {
    engine.resume()
  } else {
    engine.start()
  }
}

function onPause() {
  engine.pause()
}

function onReset() {
  engine.resetToFirstBeat()
}

function onVisibilityChange() {
  if (document.hidden) {
    engine.suspendOnHidden()
  } else {
    engine.resumeOnVisible()
    if (store.settings.wakeLock) void wake.reacquire()
  }
}

function onFirstGesture() {
  engine.ensureAudio()
  window.removeEventListener('pointerdown', onFirstGesture)
}

function onBeforeUnload() {
  engine.destroy()
  void wake.release()
}

// 引擎内部状态同步到 UI（音频引擎是状态的单一事实来源）
watch(
  () => engine.state.value,
  (s) => store.setTransport(s)
)

watch(
  () => store.transport,
  (s) => {
    if (s === 'playing' && store.settings.wakeLock) {
      void wake.acquire()
    } else if (s !== 'playing') {
      void wake.release()
    }
  }
)

watch(
  () => store.theme,
  (mode) => {
    document.documentElement.dataset.theme = mode
  },
  { immediate: true }
)

onMounted(() => {
  document.documentElement.dataset.theme = store.theme
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pointerdown', onFirstGesture, { once: true })
  window.addEventListener('pagehide', onBeforeUnload)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('pointerdown', onFirstGesture)
  window.removeEventListener('pagehide', onBeforeUnload)
  engine.destroy()
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="app-title">
        <span class="app-logo">◭</span>
        <span>节拍器</span>
      </div>
      <div class="header-actions">
        <button class="icon-btn" aria-label="切换主题" @click="toggleTheme">
          {{ store.theme === 'dark' ? '☀' : '☾' }}
        </button>
        <button class="icon-btn" aria-label="设置" @click="showSettings = true">⚙</button>
      </div>
    </header>

    <main class="app-main">
      <p v-if="store.errorMsg" class="toast">{{ store.errorMsg }}</p>

      <section class="beat-section">
        <BeatIndicator />
      </section>

      <section class="bpm-section">
        <BpmControl />
      </section>

      <section class="rhythm-section">
        <TimeSignaturePicker />
      </section>

      <section class="preset-section">
        <PresetManager />
      </section>
    </main>

    <footer class="app-deck">
      <div class="vol-block">
        <button
          class="icon-btn mute-btn"
          :class="{ muted: store.muted }"
          aria-label="静音"
          @click="store.toggleMute"
        >
          {{ store.muted ? '🔇' : '🔊' }}
        </button>
        <input
          class="vol-slider"
          type="range"
          min="0"
          max="100"
          :value="store.volume"
          aria-label="音量"
          @input="store.setVolume(Number(($event.target as HTMLInputElement).value))"
        />
        <span class="vol-label">{{ store.volume }}</span>
      </div>

      <TransportControls
        @toggle-main="onToggleMain"
        @pause="onPause"
        @reset="onReset"
      />

      <span class="deck-spacer" aria-hidden="true" />
    </footer>

    <SettingsPanel v-model:open="showSettings" />
  </div>
</template>

<style scoped>
.app {
  height: 100dvh;
  overflow: hidden;
  padding:
    calc(env(safe-area-inset-top, 0px) + 10px)
    calc(env(safe-area-inset-right, 0px) + 16px)
    calc(env(safe-area-inset-bottom, 0px) + 10px)
    calc(env(safe-area-inset-left, 0px) + 16px);
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
}

.app-logo {
  color: var(--accent);
  font-size: 18px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.icon-btn {
  min-width: 40px;
  min-height: 40px;
  border-radius: 12px;
  background: var(--surface-2);
  color: var(--text);
  font-size: 17px;
  display: grid;
  place-items: center;
  border: none;
  cursor: pointer;
  flex: 0 0 auto;
}

.toast {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 12px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--danger);
  color: #fff;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  z-index: 60;
  box-shadow: 0 6px 20px rgb(0 0 0 / 35%);
  max-width: 90%;
}

.app-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  justify-content: space-evenly;
}

.beat-section,
.bpm-section,
.rhythm-section,
.preset-section {
  flex: none;
}

.app-deck {
  flex: none;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.vol-block {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.deck-spacer {
  visibility: hidden;
}

.mute-btn.muted {
  opacity: 0.55;
}

.vol-slider {
  flex: 1;
  min-width: 0;
  accent-color: var(--accent);
  height: 40px;
}

.vol-label {
  width: 30px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--text-dim);
  font-size: 12px;
}

/* 短屏（如 iPhone SE / 小屏安卓）压缩布局，保证一屏无滚动 */
@media (max-height: 640px) {
  .app {
    gap: 4px;
    padding-top: calc(env(safe-area-inset-top, 0px) + 6px);
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 6px);
  }

  .app-main {
    gap: 4px;
  }

  .icon-btn {
    min-width: 36px;
    min-height: 36px;
  }

  .vol-slider {
    height: 34px;
  }
}

@media (max-width: 360px) {
  .vol-label {
    display: none;
  }
}
</style>
