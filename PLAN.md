# soul-blog-theme 多端组件库方案计划书

## 一、背景与目标

现有 `vanilla/`（原 `vite/`）目录是一套**原生 JS + Vite + Tailwind** 的博客主题，组件用 Web Components 但属于 **light DOM**（`innerHTML` 直塞、无自带样式），且交互逻辑高度集中在 `main.js` 的根级事件委托里，并非真正的可复用组件。

未来会有多种形态：**原生版、Vue 版、React 版、Hexo 主题版**。目标定为：

> 抽取一套**框架无关的 Web Components 组件库** **`@soul-blog/wc`** 作为唯一 UI 真源，业务逻辑只维护一份，各端做薄封装复用，避免多端重复实现。

## 二、命名约定

统一按**运行时框架维度**命名（而非构建工具/产物），各版本关系清晰：

| 目录         | 含义                     |
| ---------- | ---------------------- |
| `vanilla/` | 原生 JS 版（无框架，原 `vite/`） |
| `vue/`     | Vue 版                  |
| `react/`   | React 版                |
| `hexo/`    | Hexo 静态主题版             |

## 三、总体架构

```
┌────────────────────────────────────────────────────┐
│  @soul-blog/wc（唯一 UI 真源）                        │
│  Shadow DOM + 样式自包含 + 交互逻辑内聚               │
└───────────────────────┬────────────────────────────┘
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   Vue 封装层       React 封装层      Hexo 主题层
  (薄 SFC wrapper)  (@lit/react)    (EJS 服务端渲染 + ESM)
        │               │               │
   页面/路由/数据装配（框架层各自负责）
```

分层职责：

| 层     | 职责                                 | 存放                          |
| ----- | ---------------------------------- | --------------------------- |
| 设计系统  | theme token、Tailwind 主题 CSS、CSS 变量 | `core/styles`               |
| 组件库   | 自包含 WC 组件 + 交互 + 内部状态              | `core/src`（`@soul-blog/wc`） |
| 数据/契约 | 文章/目录/站点配置类型 + 数据源抽象               | `core/types`                |
| 框架封装  | 属性/事件绑定，提供框架原生用法                   | `themes/*`                  |

## 四、核心改造（一次性投入）

现有组件要"能安全共用"，需完成三处重构：

1. **Light DOM → Shadow DOM + 样式自包含**
   每条组件用 `adoptedStyleSheets` 或内联 `<style>` 携带自身样式，避免到 Vue/React/Hexo 后样式外泄或被宿主污染。

2. **交互逻辑从** **`main.js`** **内聚回组件**
   现状：模板函数分散各组件，而点击/FLIP 动画/搜索/播放逻辑全在 `main.js` 根级事件委托。重构后每个 WC 自持事件与状态。

3. **数据/配置注入接口标准化**
   组件不写死内容，通过 **DOM 属性（简单值）+ JS property（对象/数组）+ 自定义事件（动作回调）** 对外通信；站点配置沿用"`site-config.json` / `window.__SITE_CONFIG__` / 默认值"三级优先级。

## 五、组件改造映射

| 组件（WC）                          | 现状              | 改造后职责                           |
| ------------------------------- | --------------- | ------------------------------- |
| `site-background`               | 静态装饰            | 自持背景素材，无外部依赖                    |
| `site-sidebar`                  | 目录导航 + 滑动指示条    | 内聚高亮/滑条动画，导航数据由 property 注入     |
| `article-list` + `article-card` | 无限滚动 + 卡片       | 内聚 IntersectionObserver 续载与卡片渲染 |
| `article-viewer`                | FLIP 动画 + 评论/推荐 | 内聚开合动画、路由参数同步、评论交互              |
| `music-player`                  | 播放/进度/音量/列表     | 内聚音频引擎与 `localStorage` 持久化      |
| `search-panel`                  | 站内模糊搜索弹出层       | 内聚模糊匹配与键盘导航                     |
| `search-results`                | 结果页列表           | 由 `article-list` 复用渲染           |
| `login-panel`                   | 登录表单            | 内聚表单校验与"记住登录"持久化                |

> 原则：**WC 覆盖可跨端复用的交互 UI**；页面级布局、路由、数据装配、配置接线由各端各自负责，不进组件库。

## 六、工程结构（pnpm workspace monorepo）

```
soul-blog-theme/
├── packages/
│   └── core/                    # @soul-blog/wc  组件库（唯一真源）
│       ├── src/
│       │   ├── components/      # 各 WC（Shadow DOM 自包含）
│       │   ├── styles/          # theme CSS + token
│       │   ├── types/           # 类型契约
│       │   └── index.ts         # 统一注册 + 导出
│       ├── vite.config.ts       # build.lib 打库
│       └── package.json
├── themes/
│   ├── vanilla/                 # 原生 JS 版（原 vite/）
│   ├── vue/                     # Vue 版（薄封装 + 路由 + Pinia 装配）
│   ├── react/                   # React 版（@lit/react 封装）
│   └── hexo/                    # Hexo 主题（EJS + ESM 引入 core）
└── ...
```

> **注意**：已确认当前为**单仓库**——根目录 `soul-blog-theme` 即 git 仓库（远程 `git@github.com:callmesoul/soul-blog-theme.git`，分支 `main`），`vite/` 并非嵌套仓库、也无子模块。因此 `vite/ → vanilla/` 改名直接 `git mv` 即可，历史完整保留、无丢历史风险（详见附录「当前 git 现状」）。

## 七、多端接入方式

| 端       | 接入                                                           | 说明                      |
| ------- | ------------------------------------------------------------ | ----------------------- |
| Vanilla | `<script type="module">` import core 注册                      | 原生版逐渐变为"消费 demo"        |
| Vue     | `app.config.compilerOptions.isCustomElement` + 薄 SFC wrapper | 复杂属性/事件通过 wrapper 声明式绑定 |
| React   | `@lit/react` `createComponent` 包一层                           | 规避 React 对对象属性/自定义事件的限制 |
| Hexo    | EJS 服务端渲染正文 + `<script type="module">` 引入 core               | 见下 SEO 约束               |

**Hexo 关键约束**：WC 是客户端渲染，正文不可走 WC（会 SEO 空 + 白屏闪烁）。因此 Hexo 里**正文/文章内容由 EJS 服务端输出**，WC 只做交互增强（侧栏高亮、播放器、搜索、阅读器动效）。

## 八、分阶段路线图

- **阶段 0 · 基建**：建 monorepo、pnpm workspace、`core` 包骨架、Tailwind + 设计 token、类型契约。

- **阶段 1 · 组件库重构**（核心投入）：逐个把现有组件改造成 Shadow DOM 自包含 + 逻辑内聚的 WC；Vite `build.lib` 产出包。

- **阶段 2 · 跨端验证（Vanilla）**：`vanilla/` 切到消费 `core`，验证组件易用性，作为组件库的活文档。

- **阶段 3 · Vue 版**：`themes/vue` 搭 Vue3+TS+Router+Pinia，薄封装 core 组件。

- **阶段 4 · React 版**：`themes/react` 用 `@lit/react` 封装。

- **阶段 5 · Hexo 版**：`themes/hexo` 服务端渲染 + ESM 引入 core。

- **阶段 6 · 打磨验收**：三端视觉一致、类型/构建/动效/SEO 回归。

## 九、验收标准

- `core` 可 `import` 后独立使用，样式不外泄、不依赖宿主自定义 CSS。

- 原生 / Vue / React / Hexo 四端共用同一套组件，视觉与交互 1:1 一致。

- Hexo 正文服务端渲染，SEO 与首屏不回归；搜索/播放/阅读器交互正常。

- 深链、前进/后退、`prefers-reduced-motion`、localStorage 持久化行为一致。

- 业务逻辑仅存在于 `core`，各端层只做薄封装。

## 十、风险与应对

| 风险                         | 应对                                           |
| -------------------------- | -------------------------------------------- |
| FLIP 动画 + Shadow DOM 测量复杂度 | 阶段 1 单独攻坚，先复刻再优化                             |
| React 消费 WC 的 props/事件摩擦   | 统一用 `@lit/react` wrapper，复杂交互下沉进组件内部         |
| Hexo SSR 与 WC 客户端渲染错位      | 明确"正文服务端、交互增强客户端"边界，提前定契约                    |
| monorepo 初期工程成本 + 目录重组/改名  | 先跑通 `core` + Vanilla，再逐端扩展；`git mv` 改名、逐目录清理 |

## 附录：当前 git 现状（已梳理）

- **仓库形态**：单一 git 仓库，根目录即仓库（非多仓库、非拆库 monorepo 状态）。

- **远程 / 分支**：`origin → git@github.com:callmesoul/soul-blog-theme.git`，仅 `main` 分支，跟踪 `origin/main`。

- **历史**：3 次提交，最近为 `chore: init root repository (migrate vite theme to monorepo)`，说明"迁移到 monorepo"刚起步。

- **嵌套仓库 / 子模块**：无（`git submodule` 为空、无 `.gitmodules`、全仓库仅根目录一个 `./.git`）。

- **被跟踪内容（775 文件）**：`.gitignore`、`design/`（PSD/PNG 设计稿）、`public/`（仅 5 个音频）、`vite/`（整个博客主题）。

- **未跟踪 / 占位**：`vue/` 为空目录（git 不跟踪空目录）；`vite.kanban-worktrees/` 已被 `.gitignore` 忽略，内含两个残留 UUID 目录（仅 `.codex`/`.vite` 元数据，非真正 worktree），可安全清理。

- **`.gitignore`** **已忽略**：`node_modules/`、`dist/`、`.codex/`、`.vite/`、`.dsh-vision-router/`、`.DS_Store`、`*.log`、`.codebuddy/`、`vite.kanban-worktrees/`、`.claude/`。

- **待办**：① `vite/ → vanilla/` 改名；② 目录重组（`packages/core`、`themes/*`）；③ 清理重复音频与 `vite/` 内旧工程文件；④ 可选 `git config core.quotePath false` 让中文文件名可读。

