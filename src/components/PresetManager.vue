<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMetronomeStore } from '../stores/metronome'
import { TEMPO_TERMS } from '../utils/constants'
import type { SavedPreset } from '../stores/metronome'

const store = useMetronomeStore()

const showInput = ref(false)
const nameDraft = ref('')
const selectedId = ref<string | null>(null)

const flashTerm = ref<string | null>(null)
let flashTimer: number | null = null

const savedPresets = computed(() => store.presets)

function applyTempoTerm(term: { name: string; bpm: number }) {
  store.setBpm(term.bpm)
  flashTerm.value = term.name
  if (flashTimer !== null) window.clearTimeout(flashTimer)
  flashTimer = window.setTimeout(() => {
    flashTerm.value = null
  }, 1200)
}

function applyPreset(preset: SavedPreset) {
  store.applyPreset(preset)
  selectedId.value = preset.id
}

function removePreset(id: string) {
  store.deletePreset(id)
  if (selectedId.value === id) selectedId.value = null
}

function save() {
  const name = nameDraft.value.trim()
  if (!name) return
  store.savePreset(name)
  nameDraft.value = ''
  showInput.value = false
}

// 左右滑动切换预设
let startX = 0
let swiping = false

function onTouchStart(e: TouchEvent) {
  startX = e.touches[0].clientX
  swiping = true
}

function onTouchEnd(e: TouchEvent) {
  if (!swiping) return
  swiping = false
  const dx = e.changedTouches[0].clientX - startX
  const list = savedPresets.value
  if (list.length === 0) return
  if (Math.abs(dx) < 60) return
  const cur = list.findIndex((p) => p.id === selectedId.value)
  let next = dx < 0 ? cur + 1 : cur - 1
  if (cur === -1) next = dx < 0 ? 0 : list.length - 1
  if (next < 0) next = list.length - 1
  if (next >= list.length) next = 0
  applyPreset(list[next])
}
</script>

<template>
  <div class="presets">
    <div class="presets-head">
      <span class="title">速度术语</span>
      <button class="save-btn" @click="showInput = true">＋ 保存当前</button>
    </div>

    <div class="chips-row">
      <button
        v-for="term in TEMPO_TERMS"
        :key="term.name"
        class="chip"
        :class="{ active: flashTerm === term.name }"
        @click="applyTempoTerm(term)"
      >
        {{ term.name }} <b>{{ term.bpm }}</b>
      </button>
    </div>

    <Transition name="row">
      <div v-if="showInput" class="save-row">
        <input
          v-model="nameDraft"
          type="text"
          maxlength="16"
          placeholder="预设名称"
          @keydown.enter="save"
        />
        <button class="chip primary" @click="save">保存</button>
        <button class="chip" @click="showInput = false">取消</button>
      </div>
    </Transition>

    <template v-if="savedPresets.length > 0">
      <div class="presets-head sub">
        <span class="title">我的预设（左右滑动切换）</span>
        <span class="count">{{ savedPresets.length }}</span>
      </div>
      <div
        class="preset-list"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <div
          v-for="p in savedPresets"
          :key="p.id"
          class="preset-item"
          :class="{ active: selectedId === p.id }"
          @click="applyPreset(p)"
        >
          <span class="p-name">{{ p.name }}</span>
          <span class="p-meta">
            {{ p.bpm }} BPM · {{ p.beats }}/{{ p.unit }}
          </span>
          <button
            class="p-del"
            aria-label="删除预设"
            @click.stop="removePreset(p.id)"
          >
            ✕
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.presets {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.presets-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.presets-head.sub {
  margin-top: 4px;
}

.title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-dim);
  letter-spacing: 1px;
}

.count {
  color: var(--text-dim);
  font-size: 12px;
}

.save-btn {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px dashed var(--accent);
  background: transparent;
  color: var(--accent);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.chips-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.chips-row::-webkit-scrollbar {
  display: none;
}

.chip {
  flex: 0 0 auto;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 11px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-dim);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.chip b {
  color: var(--text);
  margin-left: 4px;
  font-variant-numeric: tabular-nums;
}

.chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.chip.active b {
  color: #fff;
}

.save-row {
  display: flex;
  gap: 8px;
}

.save-row input {
  flex: 1;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  padding: 0 12px;
  font-size: 14px;
}

.chip.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.preset-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
  touch-action: pan-y;
}

.preset-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 6px 44px 6px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  cursor: pointer;
  touch-action: pan-y;
}

.preset-item.active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, var(--surface-2));
}

.p-name {
  font-weight: 700;
  font-size: 14px;
}

.p-meta {
  color: var(--text-dim);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.p-del {
  position: absolute;
  right: 6px;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
}

.p-del:active {
  color: var(--danger);
  background: var(--muted-bg);
}

.row-enter-active,
.row-leave-active {
  transition: all 0.2s;
}

.row-enter-from,
.row-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
