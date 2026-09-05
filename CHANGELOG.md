# Changelog

本项目的所有值得注意的变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

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

#### React 19 主题 (`themes/react`)

- React 19 + Zustand + React Router 6 技术栈
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