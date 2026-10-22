# 移动端 Vue3 网页节拍器 - 功能实现规格说明

> **在线预览（已部署）：** [https://smallteddy.github.io/metronome/](https://smallteddy.github.io/metronome/)

## 一、项目概述
基于 Vue3 + Vite + TypeScript 的移动端网页节拍器应用，纯前端实现，无后端依赖，支持离线使用（PWA可选）。核心目标是提供精准、流畅、易用的节拍训练工具。

---

## 二、核心功能模块

### 1. 音频引擎模块（核心）
- **精准计时调度**：使用 Web Audio API 的 `AudioContext.currentTime` 作为时间基准，**禁止使用 `setInterval` 直接驱动节拍**。采用「Ahead-of-time 调度器」模式（参考 Chris Wilson 的 "A Tale of Two Clocks"），每 25ms 检查一次，提前调度未来 100ms 内的节拍。
- **节拍音色合成**：通过 `AudioContext.createOscillator()` + `GainNode` 生成点击声，强拍（第一拍）用高频（如 1000Hz）、弱拍用低频（如 800Hz），支持音量包络（快速 attack + 短 decay）避免爆音。
- **音色预设**：至少提供 3 种音色（经典木鱼声、电子滴答、机械节拍），可切换。
- **音量控制**：0-100 滑杆，实时生效，静音开关。
- **首拍唤醒**：iOS 需用户手势（`touchstart`/`click`）首次激活 `AudioContext.resume()`，避免自动播放限制。

### 2. BPM 控制模块
- **BPM 范围**：30 - 300 BPM，步进 1。
- **调节方式**：
  - 大号 +/- 按钮（单击 ±1，长按连续调节）
  - 中央数字显示（可点击直接输入）
  - 滑杆快速拖动
  - **Tap Tempo（点按定速）**：连续点击按钮，取最近 4-6 次点击间隔的平均值计算 BPM，间隔超过 2 秒重置。
- **BPM 显示**：大字号居中，实时同步。

### 3. 拍号与节奏模块
- **拍号选择**：支持 1/4、2/4、3/4、4/4、6/8、3/8 等常用拍号，通过下拉或轮盘选择。
- **强弱拍区分**：每小节第一拍为强拍（高音+视觉高亮），其余为弱拍。支持自定义「每拍重音」（如 4/4 中设置 1、3 拍为强拍）。
- **细分音符**：支持四分、八分、十六分、三连音细分，细分拍音量可单独设置（如弱化细分音）。

### 4. 视觉反馈模块
- **节拍指示灯**：一排圆点表示当前小节各拍，当前拍高亮放大+颜色变化（强拍红色/弱拍蓝色），与音频严格同步（通过调度器回调驱动 UI）。
- **摆动动画**：可选「节拍摆锤」或「呼吸圆环」动画，周期与 BPM 同步，使用 CSS 动画或 `requestAnimationFrame`。
- **播放状态可视化**：播放/暂停按钮状态切换，BPM 数字随节拍轻微脉冲。

### 5. 播放控制模块
- **开始/停止**：大按钮，停止时重置到第一拍。
- **暂停/继续**：保留当前拍位置。
- **第一拍重置**：双击停止按钮回到第 1 拍。

### 6. 预设管理模块
- **保存预设**：将当前 BPM、拍号、音色、音量、重音设置保存为命名预设，存入 `localStorage`。
- **预设列表**：展示、加载、删除预设，支持快速切换。
- **内置预设**：提供常用速度术语（Largo 50、Andante 80、Moderato 100、Allegro 120、Presto 180）一键切换。

### 7. 移动端交互与适配
- **响应式布局**：适配 320px - 768px 宽度，竖屏为主，安全区适配（`env(safe-area-inset-*)`）。
- **触摸优化**：按钮最小 44×44px 触控区，`touch-action: manipulation` 防双击缩放，禁用长按选择。
- **手势支持**：左右滑动切换预设，长按 +/- 连续调节。
- **屏幕常亮**：播放时调用 `Wake Lock API`（`navigator.wakeLock.request('screen')`），停止时释放（降级方案：提示用户）。
- **震动反馈**（可选）：`navigator.vibrate()` 在强拍时短震。

### 8. 状态持久化
- 使用 `localStorage` 或 `pinia-plugin-persistedstate` 持久化：上次 BPM、拍号、音色、音量、预设列表、主题。
- 页面刷新/重新打开后恢复上次状态。

### 9. 主题与设置
- **深色/浅色主题**切换，默认深色（适合舞台/练习环境）。
- **设置项**：节拍音色、细分音开关、震动开关、屏幕常亮开关、闪烁动画开关。

### 10. 异常与边界处理
- 页面切到后台（`visibilitychange`）时暂停调度器，回前台恢复（避免音频漂移）。
- `AudioContext` 创建失败/被挂起时的降级提示。
- BPM 输入非法值（非数字、超范围）的校验与回退。

---

## 三、技术实现要点（给 AI 的约束）
- **框架**：Vue3 `<script setup>` + TypeScript + Pinia（状态管理）+ Vite。
- **音频**：Web Audio API 自实现调度器，封装为 `useMetronome` composable，暴露 `start/stop/pause/setBPM/setTimeSignature` 等。
- **组件拆分**：`BpmControl.vue`、`TransportControls.vue`、`BeatIndicator.vue`、`TimeSignaturePicker.vue`、`PresetManager.vue`、`SettingsPanel.vue`。
- **性能**：UI 更新用 `requestAnimationFrame` 或调度回调节流，避免每拍触发大量重渲染；音频调度与 UI 渲染解耦。
- **无第三方音频库依赖**（可选 tone.js 但优先原生）。
- **PWA**（可选）：`vite-plugin-pwa` 支持离线与添加到主屏幕。

---

## 四、验收标准
1. 120 BPM 连续播放 5 分钟，节拍漂移 < 5ms（用 `AudioContext.currentTime` 校准验证）。
2. 强/弱拍音高与视觉高亮严格对齐。
3. iOS Safari / Android Chrome 首次点击后音频正常出声。
4. 切后台再回前台，节拍不混乱、不叠加。
5. 所有交互按钮触控区 ≥ 44px，无 300ms 点击延迟。
6. 刷新页面后恢复上次 BPM、拍号、音色、预设。

---
