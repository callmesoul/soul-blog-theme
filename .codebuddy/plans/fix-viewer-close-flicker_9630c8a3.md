---
name: fix-viewer-close-flicker
overview: 修复阅读器（详情面板）收拢关闭动画结束瞬间的闪烁/快速缩放观感：消除封面克隆提前 cancel 引起的回弹帧，并在面板收拢到卡片后以短暂淡出替代整层突隐，使收拢结尾与卡片无缝衔接。
todos:
  - id: fix-close-flicker
    content: 删除 closeViewer 提前的 flyBack.cancel，改为 ghost 落位定时器对齐缩略图末帧
    status: completed
  - id: panel-fade-out
    content: 给收拢面板加延迟 opacity 淡出，并在 finish 与 panelReset 中复位 opacity
    status: completed
    dependencies:
      - fix-close-flicker
  - id: verify-regression
    content: 用 lsp-code-analysis 复查复位分支与诊断，npm run build 后人工回归开合切换
    status: completed
    dependencies:
      - panel-fade-out
---

## 用户需求
修复详情页阅读器“弹出后关闭”时的闪烁问题。

## 问题定位（用户已确认）
- 时机：收拢（缩回卡片）动画结束的那一帧。
- 观感：像详情内容突然“快速缩放”了一下。
- 场景：同一目录打开文章后直接关闭，不涉及列表重建。

## 修复目标
消除关闭收拢动画末段的画面突变，使面板“无缝落回”原卡片，不再闪跳；同时不影响打开动画、文章切换、深链直达、切换目录后关闭等既有流程。


## 技术方案

### 根因（已核实代码）
`closeViewer`（vite/src/js/main.js ~862-933 行）收拢时序存在两处“末段突变”：

1. **封面克隆回弹（主要闪烁源）**：收拢用 `flyBack = ghost.animate(..., { fill:'both' })` 从正文封面缩回卡片缩略图，但第 928 行在 `FLIP_CLOSE_MS`(300ms) 提前执行 `flyBack.cancel()`。取消后 `fill:'both'` 失效，ghost 立即回落到 inline 样式 `transform = fromTf ≈ identity`，即**整张正文封面以原尺寸在原位重新弹出**，悬浮 110ms（300→410ms）后才随 `viewer.hidden = true` 整层消失——正是用户看到的“详情快速缩放闪一下”。
2. **面板停驻遮黑再突隐**：300ms 时面板已缩成与卡片矩形完全重合的不透明深色块（`.is-anim` 实底），在原 110ms 缓冲窗口内把卡片遮成暗块；410ms `finish()` 一帧内 `viewer.hidden=true` 造成“暗块→卡片突亮”的截断闪。

对照：打开路径 `finishOpen`（~798-806 行）在同一 tick 内 `fly.cancel()+ghostReset()`，因此无此问题。

### 修复设计（只改 vite/src/js/main.js，CSS 无需改动）
1. **删除第 928 行的提前 `flyBack.cancel()`**，让动画以 `fill:'both'` 保持末帧；末帧由 `finish()` 内已有的 `ghostReset()`（cancel 全部动画 + display:none）与 `viewer.hidden = true` **同帧清理**，回弹不再可见。
2. **末帧像素对齐**：新增一个 `FLIP_CLOSE_MS` 处的“落位”定时器，将 ghost 的 inline 宽/高重置为 `thumbLocal.width/height`、transform 重置为 `translate(thumbLocal.left, thumbLocal.top) scale(1)`（object-fit 不变），使克隆在 300→410ms 停驻窗口内与真实卡片缩略图逐像素一致，`finish` 隐藏时无缝交接，杜绝因非等比缩放造成的残影差。
3. **面板收尾淡出，消除“暗→亮”截断**：将 shrink 段面板的 transition 改为组合式内联过渡 `transform 300ms cubic-bezier(0.45,0,0.55,1), opacity 100ms ease 300ms`，并同时设置 `panel.style.opacity = '0'`（带 300ms 延迟触发）。transform 定格在卡片矩形后，面板自身在 300→400ms 透明化，露出下方卡片；`finish` 仍在 `FLIP_CLOSE_MS + 110`(410ms) 执行，此刻 opacity 已为 0，`viewer.hidden=true` 无可见跳变。
4. **清理与抢占复位（防止新状态残留）**：
   - `finish()` 增加 `panel.style.opacity = ''`（transition/transform 复位已有）。
   - `panelReset()` 增加 `panel.style.opacity = ''`，确保关闭中抢占触发的再次打开（openViewer rAF 内）不会带着 opacity:0 显示。
   - reduceMotion / 卡片不可测量等直接 `finish()` 分支不受影响（未设置过渡与淡出）。

### 关键实现锚点
- 删除：main.js ~928 行 `setTimeout(() => { if (flyBack && flyBack.cancel) flyBack.cancel() }, FLIP_CLOSE_MS)`。
- 修改：~907 行 transition 赋值为双段内联过渡；其后补 `panel.style.opacity = '0'`；新增 ghost 落位定时器。
- 修改：`finish()`（~872-886 行）加 `panel.style.opacity = ''`。
- 修改：`panelReset()`（~711-716 行）加 `panel.style.opacity = ''`。
- 时序不变：130ms 预延迟、300ms shrink、410ms finish 均保持，仅将原“停顿窗口”改为“ghost 对齐 + 面板淡出窗口”。

### 回归验证
- `vite` 目录下 `npm run dev` 人工回归：同目录开→关、阅读中切文章、深链刷新后关闭、切目录后关闭、reduceMotion 场景，确认三态切换无新闪烁/残留（尤其连续快速开关、动画中抢占）。
- `npm run build` 确认构建通过；用 lsp 诊断复查改动行无 lint/类型问题。


## Agent Extensions
### Skill
- **lsp-code-analysis**
  - Purpose: 在改动前用符号引用核对 `panelReset`/`finish`/`ghostReset` 的全部调用点与 panel inline 样式写入点，确保淡出状态与清理逻辑覆盖所有抢占路径；改动后复查 main.js 诊断，确认无遗留引用或未复位状态。
  - Expected outcome: 确认修复不遗漏任何复位分支，且 lint 干净、无残留引用（如被删除的 flyBack.cancel）。
