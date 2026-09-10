# Changelog

本项目的所有值得注意的变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [1.3.0] - 2026-09-10

### Added

- **关于我页面**（第 10 个 Web Component `<about-page>`，四端统一）：
  - 杂志式卡片布局：Manifesto 大卡、`Currently` 状态卡、普通文本卡、联系方式卡（支持 `href` 整卡可点）
  - 内容全部由 `site-config.json` 的 `about` 字段驱动（`kicker` / `title` / `titleAccent` / `description` / `cards`），改配置即改页面，无需改代码
  - 卡片 `variant` 支持 `wide`（宽卡）与 `accent`（强调色）
  - 各端落地：vanilla `about.html`、Vue `AboutView.vue`（`/about`）、React `AboutPage.tsx`、Hexo `layout/about.ejs` + `scripts/about.js`
  - 新增类型契约 `packages/core/src/types/about.ts`

### Changed

- README 补充「关于我」页面说明：特性条目、截图预览（新增 `assets/screenshots/about.png`）、组件清单 9 → 10、路由表新增 `/about`、站点配置补 `about` 字段示例
- 各包 `version` 随本次发布统一到 `1.3.0`（根 `package.json`、`@soul-blog/wc` 及四个主题此前分别为 `1.0.0` / `0.1.0`，长期与 CHANGELOG 不同步；此后每次发布全仓同步）

## [1.2.0] - 2026-09-09

### Added

- **归档页**（`<archive-list>`，四端统一）：
  - 年 → 月 → 文章 三级倒序时间线，年 / 月 header 显示该时间段篇数，月份可折叠
  - 渐进续载：默认渲染 4 个年份，滚动触底每次加载 2 个，加载完毕显示「已经到底啦 · 共 N 篇」
  - 年份快捷导航：桌面 `≥760px` 容器查询显示右侧 sticky 列表，窄屏显示顶部胶囊
  - 各端路由：vanilla `archives.html`、Vue `/archives`、React `/archives`、Hexo `/archives/`（由 `scripts/archives.js` 自定义生成器产出）
- **双轨侧栏** `site-sidebar`：可折叠目录面板（一级导航 / 二级分类）、分类文章数 `count`、侧栏 logo 区按页面上下文切换文案（首页 / 目录 / 归档）
- **可取消事件**：`wc-base.emit` 支持 `{ cancelable }`；阅读器内点击 tag 先派发可取消 `tag-select` 事件，宿主可 `preventDefault()` 接管路由
- **按路由维护页面标题**：Vue / React / vanilla / hexo 各端统一（首页 / 登录 / 归档 / 搜索 / 文章）
- Hexo 归档页点击文章原地 FLIP 翻转弹出阅读器（与首页一致，不再整页跳转）

### Changed

- `wc-base` 的 `attributeChangedCallback` 现在仅对子类在 `observedAttributes` 中声明的属性生效，符合 Web Components 规范，避免外部库设置无关属性时触发 Shadow DOM 重建
- `archive-list` 重渲染改用 `requestAnimationFrame` 调度（防重入），避免在 Vue setter 链中触发同步栈溢出
- 侧栏新增 `archiveUrl` 属性：非空时在「首页」与「分类」之间插入「归档 / Archives」原生链接项
- README 与截图更新：归档时间线、面包屑、标签筛选；组件清单 8 → 9；新增「路由 & 页面」章节；主题定制改为 Tailwind v4 设计令牌；截图统一 1440 窗口

### Fixed

- 归档页 `document.title` 错显「首页」：Vue / React 原在 `applySiteConfig()` 无条件写入首页标题，改为由路由层维护
- 归档页侧栏 logo 区仍显示「首页 / HOME」：`attributeChangedCallback` 未同步 `archive-context` / `directory-open` 类
- 点侧栏「目录」二级导航不显示分类：`_syncPrimaryState` 用 `active-cat` 反推 `directoryOpen`，覆盖了用户点击展开的状态
- Hexo 文章页阅读器被误关闭：`applyRoute()` 在 SSR 页面（无 `article-list`）错误执行 `closeWithFlip()` 并改写标题，新增 `if (!articleList) return` 守卫
- Hexo 文章正文显示字面 HTML 标签：`article-viewer` 对已渲染的 `page.content` 重复 `escapeHtml`
- Vue 阅读器内点击 tag 白屏：组件内写死的 `location.hash` 与 vue-router hash 结构冲突，改为由宿主通过 `tag-select` 接管 `router.push`
- React 阅读器内点击 tag 弹窗不关闭 / 标题残留：`ArticleViewer.tsx` 未监听 `tag-select`，且关闭回调无条件回落 `#cat=` 导致自动关闭分支被守卫拦截
- Vue 归档页 `RangeError: Maximum call stack size exceeded`：由 `attributeChangedCallback` 规范化 + rAF 防重入修复（三端归档页现已均可正常渲染）

## [1.1.0] - 2026-09-06

### Changed

- 横向文字 logo 替换侧栏原有 logo 图标，支持自定义尺寸
- 资源文件抽取到根目录 `assets/`，vanilla/vue/react 三个主题共享同一份资源
- 未使用的图片和设计文件被清理，`assets/images/` 精简至 37 个文件

### Fixed

- 文章阅读器关闭动画：FLIP 收拢动画在 Vue/React 主题中不生效，根因为 Shadow DOM 查询穿透失败
- Vue/React 主题文章列表滚动加载无效：`_loadMore()` 在初始渲染后未触发，内容未填满时永不加载
- 评论框无法提交：表单选择器 `#comment-form` 与模板 `data-part` 属性不匹配
- 跨 Shadow DOM 滚动条样式不一致：为所有 Web Component 添加 `::-webkit-scrollbar` 样式
- 文章阅读器 Vue/React 主题中弹出为全屏而非面板约束：缺少 `overflow-hidden` 定位上下文
- 导航栏、社交栏、音乐播放器样式与基准 commit 不一致（多项样式回归）

## [1.0.0] - 2026-09-05

### Added

#### 核心组件库 (`@soul-blog/wc`)

- 8 个 Shadow DOM Web Components：`site-background`、`site-sidebar`、`article-list`、`article-viewer`、`search-panel`、`search-results`、`music-player`、`login-panel`
- `WcBase` 基类：`adoptedStyleSheets` 样式注入 + 统一生命周期管理
- 工具函数：`Store`（localStorage 封装）、`fuzzySearch`（模糊搜索）、`escapeHtml`、`formatTime`
- TypeScript 类型契约：`Article`、`Category`、`SiteConfig`、`SocialItem` 等
- Tailwind CSS v4 主题变量（`--brand-primary`、`--brand-cta` 等 30+ 语义色值）

#### 原生 JS 主题 (`themes/vanilla`)

- 首页文章列表：目录导航、卡片网格、分类筛选、加载后入场动画
- 阅读器：FLIP 动画切换、段落 / 代码 / 引用渲染、评论点赞区、推荐阅读
- 站点背景：粒子 / 星尘动效背景层
- 音乐播放器：播放 / 暂停、进度与音量控制、播放列表、跨目录保持播放状态
- 登录页：密码显隐切换、错误提示、社交登录入口
- 站内搜索：`Ctrl/Cmd + Shift + F` 全局快捷键、模糊匹配、键盘导航、独立搜索结果页
- 主题配置化：`public/site-config.json`、`window.__SITE_CONFIG__` 与内置默认值三级合并
- 响应式布局：侧栏可折叠，窄屏自适应

#### Vue 3 主题 (`themes/vue`)

- Vue 3 + Pinia + Vue Router 4 技术栈
- 4 个 Web Components 的 thin wrapper 组件
- 3 个视图页面：`HomeView`、`LoginView`、`SearchView`
- Pinia store：`useArticleStore`、`useSiteConfigStore`
- Hash 路由同步

#### React 18 主题 (`themes/react`)

- React 18 + Zustand + React Router 6 技术栈
- 4 个 Web Components 的 thin wrapper 组件
- 3 个页面：`HomePage`、`LoginPage`、`SearchPage`
- Zustand store：`useArticleStore`、`useSiteConfigStore`

#### Hexo 主题 (`themes/hexo`)

- 5 个 EJS 模板：`layout.ejs`、`index.ejs`、`post.ejs`、`page.ejs`、`head.ejs`、`scripts.ejs`
- Vite 构建客户端资源（JS + CSS），输出到 `source/` 目录
- 从 Hexo `site.posts` 自动生成 `#site-data` JSON 并注入 Web Components
- 文章页内联数据到 `article-viewer`

#### 基础设施

- pnpm monorepo 架构（`packages/*` + `themes/*`）
- 统一的 TypeScript 配置
- Vite 8 构建链
- Tailwind CSS v4 样式系统

### Changed

- 将原 `vite/` 目录重构为 `themes/vanilla/` 作为 monorepo 子包
- 所有组件从 light DOM 迁移为 Shadow DOM Web Components
- 样式系统从全局 CSS 迁移为 Tailwind CSS v4 + `adoptedStyleSheets`
- 类型定义从 JSDoc 注释迁移为 TypeScript 类型契约

### Fixed

- Vue 组件 watcher 初始化时序：`immediate: true` 在 setup 阶段同步执行时 ref 尚未挂载，改用 `onMounted` + watch 独立模式
- Vue 模板类型推断：`v-bind` 传递复杂数据到 Web Components 时满足 `vue-tsc` 检查
- Vite 8 兼容性：`lib.entry` 不支持 CSS 文件入口，改为在 JS 中 `import './style.css'`
- React JSX 自定义元素类型声明：通过 `custom-elements.d.ts` 声明 Web Components 标签