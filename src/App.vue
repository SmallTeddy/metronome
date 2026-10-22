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

      <section class="panel bpm-panel">
        <BpmControl />
      </section>

      <section class="panel">
        <TimeSignaturePicker />
      </section>

      <section class="panel beat-panel">
        <BeatIndicator />
      </section>

      <section class="panel">
        <TransportControls
          @toggle-main="onToggleMain"
          @pause="onPause"
          @reset="onReset"
        />
      </section>

      <section class="panel">
        <PresetManager />
      </section>
    </main>

    <footer class="app-footer">
      <div class="sound-row">
        <button
          class="chip chip-sound"
          :class="{ active: store.muted }"
          @click="store.toggleMute"
        >
          {{ store.muted ? '🔇 静音' : '🔊 ' + store.currentSound.name }}
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
    </footer>

    <SettingsPanel v-model:open="showSettings" />
  </div>
</template>

<style scoped>
.app {
  min-height: 100dvh;
  padding:
    calc(env(safe-area-inset-top, 0px) + 12px)
    calc(env(safe-area-inset-right, 0px) + 16px)
    calc(env(safe-area-inset-bottom, 0px) + 16px)
    calc(env(safe-area-inset-left, 0px) + 16px);
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 1px;
}

.app-logo {
  color: var(--accent);
  font-size: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.icon-btn {
  min-width: 44px;
  min-height: 44px;
  border-radius: 12px;
  background: var(--surface-2);
  color: var(--text);
  font-size: 18px;
  display: grid;
  place-items: center;
  border: none;
  cursor: pointer;
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 14px;
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

.app-footer {
  margin-top: auto;
}

.sound-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.chip {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.chip-sound {
  min-width: 128px;
}

.chip-sound.active {
  background: var(--muted-bg);
  color: var(--muted-text);
}

.vol-slider {
  flex: 1;
  min-width: 140px;
  accent-color: var(--accent);
  height: 44px;
}

.vol-label {
  min-width: 34px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--text-dim);
}
</style>
