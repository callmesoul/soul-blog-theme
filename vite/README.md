# soul-blog-theme

基于 **Vite + Tailwind CSS v4 + 原生 Web Components** 的博客主题（CallMeSoul 个人博客）。

无框架依赖，通过原生 JavaScript Web Components 组织页面组件，样式统一由 Tailwind CSS 实现；内置主题配置、文章列表 / 阅读器、背景粒子、音乐播放器、登录页与站内搜索。

## 功能特性

- 首页文章列表 + 分类导航 + FLIP 阅读器切换动画

- 背景粒子 / 星尘动效、响应式侧栏（可折叠）

- 音乐播放器（跨目录保持播放状态、音量 / 进度、播放列表）

- 登录页（密码显隐、错误提示）

- **站内搜索**：`Ctrl/Cmd + Shift + F` 打开弹出层，模糊搜索文章标题 / 摘要 / 目录 / 正文，键盘上下选择、回车打开；独立搜索结果页 `search.html?q=关键词`

- 主题配置化：logo / 主色 / 社交栏 / 站点信息可在运行时替换，无需重新构建

## 技术栈

| 依赖                                                               | 用途           |
| ---------------------------------------------------------------- | ------------ |
| [Vite](https://vite.dev/)                                        | 构建 / 开发服务器   |
| [Tailwind CSS v4](https://tailwindcss.com/)（`@tailwindcss/vite`） | 样式实现         |
| [vite-svg-loader](https://github.com/jpkleemans/vite-svg-loader) | SVG 资源加载     |
| 原生 Web Components                                                | 组件化（不引入前端框架） |

## 目录结构

```
vite/
├── index.html              # 首页（文章列表 + 阅读器 + 搜索弹出层）
├── login.html              # 登录页
├── search.html             # 搜索结果页
├── vite.config.js          # Vite 配置（多页入口、Tailwind、SVG）
├── public/
│   ├── site-config.json    # 站点运行时配置（构建后一并拷贝到 dist/）
│   ├── images/             # 图片素材
│   └── audio/              # 播放器音频
└── src/
    ├── css/
    │   └── style.css       # Tailwind 入口 + 品牌变量 + 自定义组件样式
    └── js/
        ├── main.js         # 页面初始化 / 交互逻辑（路由、搜索、播放器、登录）
        ├── mock-data.js    # 目录 + 文章示例数据（接入真实接口时替换此文件）
        ├── site-config.js  # 站点配置加载与主题应用
        └── components/     # Web Components（侧栏、背景、列表、阅读器、播放器、登录、搜索等）
```

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 构建产物（输出到 dist/）
npm run build

# 本地预览构建产物
npm run preview
```

> 环境要求：Node.js 18+（构建工具为 Vite 8 / Tailwind CSS 4）。

## 站点配置

站点品牌信息（logo、主色、社交栏、备案文案）的生效优先级由高到低：

1. `public/site-config.json` —— 部署后直接编辑即可换 logo / 配色 / 社交链接，无需重新打包；
2. `window.__SITE_CONFIG__` —— 运行时注入（控制台 / 后台直出，便于对接 CMS）；
3. `src/js/site-config.js` 中的 `DEFAULT_SITE_CONFIG` —— 内置默认值（兜底）。

配置字段说明（深合并：数组整体替换、对象逐层覆盖）：

```json
{
  "site": { "name": "CallMeSoul", "icp": "@CallMeSoul 粤ICP备15053557" },
  "logo": { "home": {}, "login": {}, "loginIcon": {} },
  "theme": { "primary": "#EB4F38", "cta": "#EE5B44" },
  "social": [
    { "name": "微信", "icon": "/images/...", "href": "", "qr": "/images/social/qr-weixin.svg", "hue": 74 }
  ]
}
```

- `social[]` 交互规则：`href` 为有效外链 → 新窗口跳转；否则有 `qr` → hover 弹二维码；两者皆无 → 纯展示图标。

- 主题色建议使用 `#RRGGBB` 十六进制，JS 会据此推导 `--brand-rgb` 半透明通道。

## 数据接入

目录与文章数据来自 `src/js/mock-data.js`，字段结构为：

- `CATEGORIES`：目录列表 `{ id, name, en, icon, w, h }`

- `ARTICLES`：文章列表 `{ id, cat, title, date, cover, summary, paragraphs[], ... }`

接入真实后端时，保持字段结构不变，替换该文件（或改为异步拉取）即可，主要交互与搜索逻辑无需改动。

## 使用说明

- **打开搜索**：`Ctrl + Shift + F`（macOS 为 `Cmd + Shift + F`），或点击首页列表右上角「搜索」入口。

  - `↑ / ↓` 选择结果，`Enter` 打开文章；无结果时 `Enter` 跳转搜索结果页；`Esc` 关闭。

- 阅读文章：点击列表卡片，阅读器以 FLIP 动画切换；关闭返回列表。

- 其他约定见 [AGENTS.md](./AGENTS.md)（样式与组件化规范）。

