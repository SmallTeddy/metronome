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
  selectedId.value = store.presets[store.presets.length - 1]?.id ?? null
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
    <div
      class="preset-strip"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <button
        v-for="term in TEMPO_TERMS"
        :key="term.name"
        class="chip term"
        :class="{ active: flashTerm === term.name }"
        @click="applyTempoTerm(term)"
      >
        {{ term.name }} <b>{{ term.bpm }}</b>
      </button>

      <button
        v-for="p in savedPresets"
        :key="p.id"
        class="chip preset-chip"
        :class="{ active: selectedId === p.id }"
        @click="applyPreset(p)"
      >
        <span class="p-name">{{ p.name }}</span>
        <span class="p-del" role="button" aria-label="删除预设" @click.stop="removePreset(p.id)">
          ✕
        </span>
      </button>

      <button class="chip save-chip" @click="showInput = true">＋ 保存</button>
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
  </div>
</template>

<style scoped>
.presets {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preset-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  -ms-overflow-style: none;
  padding-bottom: 2px;
  /* 右侧淡出，提示可继续滑动 */
  mask-image: linear-gradient(to right, black 0, black calc(100% - 30px), transparent 100%);
  -webkit-mask-image: linear-gradient(to right, black 0, black calc(100% - 30px), transparent 100%);
}

.preset-strip::-webkit-scrollbar {
  display: none;
}

.chip {
  flex: 0 0 auto;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 11px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-dim);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  touch-action: pan-x;
  transition: all 0.15s;
}

.chip b {
  color: var(--text);
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

.preset-chip {
  padding-right: 8px;
}

.p-name {
  max-width: 88px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.p-del {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 11px;
  color: var(--text-dim);
  background: var(--muted-bg);
  flex: 0 0 auto;
}

.preset-chip.active .p-del {
  color: #fff;
  background: color-mix(in srgb, var(--accent) 55%, transparent);
}

.save-chip {
  border-style: dashed;
  border-color: var(--accent);
  color: var(--accent);
}

.save-row {
  display: flex;
  gap: 8px;
}

.save-row input {
  flex: 1;
  min-width: 0;
  min-height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  padding: 0 12px;
  font-size: 13px;
}

.chip.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
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

@media (max-height: 640px) {
  .chip {
    min-height: 32px;
  }
}
</style>
