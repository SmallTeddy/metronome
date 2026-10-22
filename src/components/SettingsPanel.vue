<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useMetronomeStore } from '../stores/metronome'
import { SOUND_PRESETS } from '../utils/sounds'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const store = useMetronomeStore()

function close() {
  emit('update:open', false)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="backdrop" @click="close" />
    </Transition>
    <Transition name="sheet">
      <div v-if="open" class="sheet" role="dialog" aria-label="设置">
        <div class="handle" />
        <div class="sheet-title">设置</div>

        <section class="group">
          <div class="group-title">节拍音色</div>
          <div class="sound-grid">
            <button
              v-for="s in SOUND_PRESETS"
              :key="s.id"
              class="sound-card"
              :class="{ active: store.soundId === s.id }"
              @click="store.setSound(s.id)"
            >
              {{ s.name }}
            </button>
          </div>
        </section>

        <section class="group">
          <div class="group-title">音量</div>
          <label class="row">
            <span class="row-name">主音量</span>
            <input
              class="slider"
              type="range"
              min="0"
              max="100"
              :value="store.volume"
              @input="store.setVolume(Number(($event.target as HTMLInputElement).value))"
            />
            <span class="val">{{ store.volume }}</span>
          </label>
          <label class="row">
            <span class="row-name">细分音量</span>
            <input
              class="slider"
              type="range"
              min="0"
              max="100"
              :value="store.subVolume"
              @input="store.setSubVolume(Number(($event.target as HTMLInputElement).value))"
            />
            <span class="val">{{ store.subVolume }}</span>
          </label>
        </section>

        <section class="group">
          <div class="group-title">开关</div>
          <label class="row switch-row">
            <span class="row-name">细分音符</span>
            <input
              type="checkbox"
              class="switch"
              :checked="store.settings.subdivision"
              @change="store.updateSetting('subdivision', ($event.target as HTMLInputElement).checked)"
            />
          </label>
          <label class="row switch-row">
            <span class="row-name">闪烁动画</span>
            <input
              type="checkbox"
              class="switch"
              :checked="store.settings.flash"
              @change="store.updateSetting('flash', ($event.target as HTMLInputElement).checked)"
            />
          </label>
          <label class="row switch-row">
            <span class="row-name">强拍震动</span>
            <input
              type="checkbox"
              class="switch"
              :checked="store.settings.vibration"
              @change="store.updateSetting('vibration', ($event.target as HTMLInputElement).checked)"
            />
          </label>
          <label class="row switch-row">
            <span class="row-name">屏幕常亮</span>
            <input
              type="checkbox"
              class="switch"
              :checked="store.settings.wakeLock"
              @change="store.updateSetting('wakeLock', ($event.target as HTMLInputElement).checked)"
            />
          </label>
        </section>

        <section class="group">
          <div class="group-title">外观</div>
          <div class="sound-grid">
            <button
              class="sound-card"
              :class="{ active: store.theme === 'dark' }"
              @click="store.setTheme('dark')"
            >
              深色
            </button>
            <button
              class="sound-card"
              :class="{ active: store.theme === 'light' }"
              @click="store.setTheme('light')"
            >
              浅色
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 45%);
  z-index: 70;
}

.sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 71;
  background: var(--surface);
  border-top: 1px solid var(--border);
  border-radius: 20px 20px 0 0;
  padding:
    calc(env(safe-area-inset-bottom, 0px) + 14px)
    18px 18px;
  max-height: 86dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.handle {
  width: 44px;
  height: 5px;
  border-radius: 3px;
  background: var(--muted-bg);
  margin: 0 auto 10px;
}

.sheet-title {
  font-size: 16px;
  font-weight: 800;
  text-align: center;
  margin-bottom: 6px;
}

.group {
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.group:last-child {
  border-bottom: none;
}

.group-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-dim);
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.sound-grid {
  display: flex;
  gap: 10px;
}

.sound-card {
  flex: 1;
  min-height: 48px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-dim);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.sound-card.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
}

.row-name {
  flex: 0 0 96px;
  font-size: 14px;
  color: var(--text);
}

.slider {
  flex: 1;
  accent-color: var(--accent);
  height: 44px;
}

.val {
  width: 34px;
  text-align: right;
  color: var(--text-dim);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.switch-row {
  justify-content: space-between;
}

.switch {
  appearance: none;
  width: 52px;
  height: 30px;
  border-radius: 999px;
  background: var(--muted-bg);
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  flex: 0 0 auto;
}

.switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
}

.switch:checked {
  background: var(--accent);
}

.switch:checked::after {
  transform: translateX(22px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: transform 0.25s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(100%);
}
</style>
