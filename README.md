# soul-blog-theme

基于 **Web Components** 的跨框架博客主题，一套 UI 同时适配原生 JS、Vue、React、Hexo。

核心组件库 `@soul-blog/wc` 使用 Shadow DOM 封装，不依赖任何前端框架，各端通过 thin wrapper 按需集成。

## ✨ 特性

- 🎨 **跨框架一致体验** — 一套核心组件同时支持 Vanilla/Vue/React/Hexo

- 🔍 **全文模糊搜索** — 支持标题、目录、正文关键词模糊搜索，支持键盘导航

- 🎬 **FLIP 翻转动画** — 从文章卡片到详情页无缝过渡动画

- 🎵 **底部音乐播放器** — 支持播放列表、音量记忆、跨页状态保持

- 🌌 **动态背景** — 粒子/星尘动效，视觉层次感丰富

- 📱 **响应式布局** — 适配桌面、平板、移动设备

- 🔐 **登录页** — 带密码验证的私有文章入口

- ⚡ **性能优化** — 组件懒加载、图片懒加载、搜索防抖

## 📸 截图预览

|                  首页                  |                      文章阅读器                      |
| :----------------------------------: | :---------------------------------------------: |
|  ![首页](assets/screenshots/home.png)  | ![文章阅读器](assets/screenshots/article-viewer.png) |
|                **登录页**               |                     **搜索页**                     |
| ![登录页](assets/screenshots/login.png) |      ![搜索页](assets/screenshots/search.png)      |

## 🗂 项目架构

```
soul-blog-theme/
├── packages/
│   └── core/                      # @soul-blog/wc — 框架无关的组件库（唯一 UI 真源）
│       └── src/
│           ├── components/        # 8 个 Web Components（Shadow DOM + adoptedStyleSheets）
│           ├── helpers/           # 工具函数（wc-base、store、search、escape-html、format-time）
│           ├── styles/            # Tailwind CSS 主题变量
│           └── types/             # TypeScript 类型契约
│
├── themes/
│   ├── vanilla/                   # 原生 JS 主题（Vite 多页应用）
│   ├── vue/                       # Vue 3 主题（Pinia + Vue Router）
│   ├── react/                     # React 19 主题（Zustand + React Router）
│   └── hexo/                      # Hexo 博客主题（EJS 模板 + Vite 构建）
│
├── pnpm-workspace.yaml
└── package.json
```

## 组件清单

`@soul-blog/wc` 提供以下 Web Components：

| 组件             | 标签                  | 功能                       |
| -------------- | ------------------- | ------------------------ |
| SiteBackground | `<site-background>` | 背景粒子 / 星尘动效              |
| SiteSidebar    | `<site-sidebar>`    | 侧栏导航（分类、社交、站点信息）         |
| ArticleList    | `<article-list>`    | 文章卡片网格（分类筛选、入场动画）        |
| ArticleViewer  | `<article-viewer>`  | 文章阅读器（FLIP 动画、段落、评论、推荐）  |
| SearchPanel    | `<search-panel>`    | 搜索弹出层（模糊搜索、键盘导航）         |
| SearchResults  | `<search-results>`  | 搜索结果列表                   |
| MusicPlayer    | `<music-player>`    | 音乐播放器（进度、音量、播放列表、跨页保持状态） |
| LoginPanel     | `<login-panel>`     | 登录面板（密码显隐、错误提示）          |

## 技术栈

### 核心层

| 依赖                                          | 用途        |
| ------------------------------------------- | --------- |
| [Vite 8](https://vite.dev/)                 | 构建工具      |
| [Tailwind CSS v4](https://tailwindcss.com/) | 样式实现      |
| Web Components (Shadow DOM)                 | 组件封装，框架无关 |
| TypeScript                                  | 类型安全      |

### 各端框架

| 主题       | 状态管理    | 路由             | 额外依赖                   |
| -------- | ------- | -------------- | ---------------------- |
| Vanilla  | 模块级变量   | Hash 路由        | —                      |
| Vue 3    | Pinia   | Vue Router 4   | `@vitejs/plugin-vue`   |
| React 19 | Zustand | React Router 6 | `@vitejs/plugin-react` |
| Hexo     | —       | —              | EJS 模板                 |

## 快速开始

### 环境要求

- Node.js >= 20

- pnpm >= 9

### 安装依赖

```bash
pnpm install
```

### 构建核心组件库

```bash
pnpm --filter @soul-blog/wc build
```

### 构建各端主题

```bash
# 原生 JS 主题
pnpm --filter @soul-blog/vanilla build

# Vue 3 主题
pnpm --filter @soul-blog/vue build

# React 19 主题
pnpm --filter @soul-blog/react build

# Hexo 主题
pnpm --filter @soul-blog/hexo build
```

### 本地开发

各主题默认端口：

| 主题       | 端口   | 命令                                     |
| -------- | ---- | -------------------------------------- |
| Vanilla  | 5173 | `pnpm --filter @soul-blog/vanilla dev` |
| Vue 3    | 5174 | `pnpm --filter @soul-blog/vue dev`     |
| React 19 | 5175 | `pnpm --filter @soul-blog/react dev`   |
| Hexo     | 4000 | 见下方 Hexo 集成工作流                         |

```bash
# 构建核心库（watch 模式）
pnpm --filter @soul-blog/wc dev

# 原生 JS 主题
pnpm --filter @soul-blog/vanilla dev

# Vue 3 主题
pnpm --filter @soul-blog/vue dev

# React 19 主题
pnpm --filter @soul-blog/react dev
```

## 站点配置

品牌信息（logo、主色、社交栏、备案文案）通过 `site-config.json` 配置，运行时生效优先级由高到低：

1. `public/site-config.json` — 部署后直接编辑，无需重新打包
2. `window.__SITE_CONFIG__` — 运行时注入（控制台 / 后台直出）
3. 内置默认值（兜底）

配置字段说明（深合并，数组整体替换、对象逐层覆盖）：

```json
{
  "site": {
    "name": "CallMeSoul",
    "icp": "@CallMeSoul 粤ICP备15053557"
  },
  "logo": {
    "home": { "src": "/images/logo-home.png", "width": 60, "height": 55, "alt": "CallMeSoul" },
    "login": { "src": "/images/logo-login.png", "width": 201, "height": 35, "alt": "CallMeSoul" },
    "loginIcon": { "src": "/images/logo-icon.png", "width": 88, "height": 81, "alt": "" }
  },
  "theme": {
    "primary": "#EB4F38",
    "cta": "#EE5B44"
  },
  "social": [
    { "name": "微信", "icon": "/images/weixin.png", "href": "", "qr": "/images/qr-weixin.svg", "hue": 74, "width": 22, "height": 18 }
  ]
}
```

> **社交栏交互规则**：`href` 为有效外链 → 新窗口跳转；`href` 为空但有 `qr` → hover 弹二维码；两者皆无 → 纯展示图标。

## 数据接入

各端数据源通过 `TypeScript` 类型契约约束，字段结构一致即可无缝替换：

### 文章 (`Article`)

```typescript
interface Article {
  id: string
  cat: string          // 所属分类 id
  title: string
  cover: string
  summary: string
  date: string         // 'YYYY/MM/DD'
  views: number
  commentCount: number
  paragraphs: string[]
  comments?: ArticleComment[]
}
```

### 分类 (`Category`)

```typescript
interface Category {
  id: string
  name: string
  en: string
  icon: string
  w: number
  h: number
}
```

## 键盘快捷键

| 快捷键                    | 功能          |
| ---------------------- | ----------- |
| `Ctrl/Cmd + Shift + F` | 打开搜索弹出层     |
| `↑ / ↓`                | 选择搜索结果      |
| `Enter`                | 打开当前结果      |
| `Esc`                  | 关闭搜索 / 返回列表 |

## 开发指南

### TypeScript 类型检查

```bash
# 核心库
pnpm --filter @soul-blog/wc typecheck

# Vue 主题
pnpm --filter @soul-blog/vue typecheck

# React 主题（内嵌在 build 流程中）
pnpm --filter @soul-blog/react build
```

### Hexo 主题集成开发工作流

修改核心组件后需要重新构建主题并同步到测试站点：

```bash
# 1. 构建 core
cd /path/to/soul-blog-theme/packages/core
pnpm build

# 2. 构建 hexo 主题
cd /path/to/soul-blog-theme/themes/hexo
pnpm build

# 3. 同步到测试站点，重新生成
rm -rf /tmp/hexo-test/themes/hexo/
cp -r /path/to/soul-blog-theme/themes/hexo /tmp/hexo-test/themes/
cd /tmp/hexo-test
hexo clean
hexo generate

# 4. 重启服务
fuser -k 4000/tcp 2>/dev/null
sleep 2
hexo server -p 4000
```

然后浏览器硬刷新 `http://localhost:4000/`。

### 生产部署 Hexo

1. 将 `themes/hexo/` 目录复制到你的 Hexo 站点 `themes/` 目录
2. 在站点 `_config.yml` 中设置 `theme: hexo`
3. 运行 `hexo generate` 生成静态页面
4. 部署到你的服务器

### 添加新组件

1. 在 `packages/core/src/components/` 中创建 Web Component（继承 `WcBase`）
2. 在 `packages/core/src/components/index.ts` 中注册
3. 在各端主题中创建对应的 thin wrapper 组件
4. 重新构建 core 和各端主题

## ⌨️ 键盘快捷键

| 快捷键                    | 功能          |
| ---------------------- | ----------- |
| `Ctrl/Cmd + Shift + F` | 打开搜索弹出层     |
| `↑ / ↓`                | 选择搜索结果      |
| `Enter`                | 打开当前结果      |
| `Esc`                  | 关闭搜索 / 返回列表 |

## 🎨 主题定制

主题颜色在 `packages/core/src/styles/theme.css` 中定义：

```css
:root {
  --sb-primary: #EB4F38;   /* 主题主色 */
  --sb-cta: #EE5B44;        /* 按钮强调色 */
  --sb-bg: #0c0b0a;         /* 背景色 */
  --sb-card: #0f0e0d;       /* 卡片背景 */
  --sb-text: #ffffff;       /* 正文颜色 */
  --sb-meta: #9e9d99;       /* 元信息颜色 */
  --sb-border: #2a2a2a;     /* 边框颜色 */
}
```

修改后重新构建即可生效。

## ☕ 打赏

如果这个项目对你有用，可以请我喝杯奶茶 🧋

<div align="center">
  <img src="assets/images/payment.png" alt="打赏二维码" width="200">
</div>

## 📝 许可

MIT
