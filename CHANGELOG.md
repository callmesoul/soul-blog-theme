# Changelog

本项目的所有值得注意的变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.9.0] - 2026-09-16

### Added

- 新增 `pnpm package:hexo`，构建 Core 与 Hexo 后生成独立运行压缩包、版本/提交元数据及 SHA256；tag 发布工作流验证全仓版本、CHANGELOG 和工作区后将产物上传 GitHub Release，解决使用者必须在站点构建整个 monorepo、手工同步产物的问题。

### Changed

- 六个包版本统一升级为 `1.9.0`，提供向后兼容的 Hexo 运行包发布能力。
- README 补充 Hexo 运行包安装、发布与个人配置/资源分离的更新约定；AGENTS.md 明确默认资源从根 `assets/` 维护，避免编辑被忽略的构建目录导致资源无法随版本发布。

### Fixed

- Hexo Vite 构建现在清理旧产物并复制根 `assets/images/`、`assets/audio/`，解决新克隆仓库构建后缺少默认背景、图标和音乐，以及旧资源残留的问题。
- 打包命令放在 `tools/`，避开 Hexo 对根 `scripts/` 的插件自动扫描，防止内置预览误执行 ESM 命令行工具。

## [1.8.0] - 2026-09-16

### Added

- 新增仓库内置的 `fixtures/hexo` 开发站点；`pnpm dev:all` 与 `pnpm dev:hexo` 现会在监听构建 Hexo 主题资源的同时直接启动 4000 端口预览，并统一管理并发子进程，解决原命令依赖易丢失的 `/tmp/hexo-test` 站点、首次运行即因目录不存在而终止全部服务的问题。
- 友链人物画廊下沉为第 11 个核心 Web Component `<friends-page>`，并接入 Vanilla `friends.html`、Vue `#/friends`、React `/friends` 与 Hexo `/friends/`；前三端由 `site-config.json`、Hexo 由主题 `_config.yml` 的 `friends` 节点驱动，标题、说明和友链数组均可动态调整，友链支持独立地址、展示域名、介绍、字符标识、主题色与可选头像，解决原实现仅覆盖 React 且内容写死的问题。
- README 截图预览补充友链页 `assets/screenshots/friends.png`（1424×749，与既有截图规格一致）。

### Changed

- 友链入口由 React 独有的 `/friends-demo` 统一为四端一致的 `/friends`：Vue 端 `<SiteSidebar>` 补齐此前缺失的 `friendsUrl` 属性与变更监听，React 端默认值同步指向 `/friends`，Vite 多页入口与自定义元素扫描配置放行 `friends`，解决四端友链入口命名分裂、Vue 侧无法配置友链地址的问题。
- `pnpm-workspace.yaml` 放行 `hexo-util` 的构建脚本；`.gitignore` 补充忽略仓库根目录运行时生成的 `db.json` 与本地工具目录 `.workbuddy/`，避免内置 Hexo 预览站点产生的文件污染工作区。
- 六个 `package.json` 的版本号统一升级为 `1.8.0`；AGENTS.md 修正 React 预览端口笔误（5176 → 5175），并给版本号替换的 `sed` 命令补上行首缩进锚定，修复原写法会连带改写根 `package.json` 中 `hexo.version` 的问题。

### Removed

- 移除 React 主题的 `FriendsDemoPage` 与 `friends-demo.css`；其「人物画廊」方案已由配置驱动的 `<friends-page>` 落地，仅用于方案对比的静态展台不再保留。

### Fixed

- Hexo 文章 ID 改为使用稳定的永久路径，并在核心 `Article` 契约中增加独立的 `statsKey`；Vercount 不再使用会随 Hexo `db.json` 重建而变化的内部 `_id`，修复每次全新部署后单篇文章访问量从新计数，以及首页、归档页与独立文章页计数键不一致的问题。

## [1.7.0] - 2026-09-14

### Added

- 根目录新增 Core、Vanilla、Vue、React 与 Hexo 的统一 `dev:*` / `build:*` 脚本，以及并行运行全部主题开发任务的 `dev:all`；三套 Vite 预览服务固定使用文档约定的 5173–5175 端口，解决开发者需要记忆各工作区过滤命令、且并发启动时地址不确定的问题。
- 侧栏顶部 Logo 新增首页链接及键盘焦点反馈，点击后复用现有导航事件返回首页并清除当前分类或标签视图。

### Changed

- 六个 `package.json` 的版本号统一升级为 `1.7.0`；README 本地开发命令、主题端口及 Hexo watch 说明同步更新，并复核组件、路由、配置与技术栈说明仍与代码一致。

### Fixed

- 文章卡片正文区域改为纵向弹性布局，并让 `card-meta` 自动占用上方剩余空间，修复不同标题、摘要或标签长度下元信息栏无法保持底部对齐的问题。
- 文章详情页标签统一采用列表页标签的字号、内边距、间距与圆角，修复详情页独立使用胶囊样式造成的跨页面视觉不一致。
- 音乐播放器在移动端缩减控制区间距，隐藏低优先级的音量与播放模式按钮，并将播放列表入口改为紧凑图标；同时限制浮层宽度并适配底部安全区，修复窄屏下进度信息和右侧操作被挤压裁切的问题。
- 首页头部在移动端隐藏搜索快捷键提示，并在手机宽度下将搜索入口收窄为图标按钮；面包屑同时启用单行省略和弹性收缩，修复搜索栏挤压标题导致中文逐字换行的问题。
- 文章阅读器打开时在页面根节点同步 `article-viewer-open` 状态，四套主题据此在移动端隐藏首页访问统计徽标，修复固定定位徽标越过阅读器层级并遮挡推荐文章的问题。

## [1.6.0] - 2026-09-11

### Changed

- 文章阅读器重构阅读视觉：桌面正文限制为 860px 舒适行宽，强化标题、链接、列表、引用、行内代码、代码块、表格与图片的层级，封面采用稳定比例与柔和边框阴影；无推荐文章时自动收起空侧栏。
- 六个 `package.json` 的版本号统一升级为 `1.6.0`，README 的特性、组件说明与文章阅读器截图同步更新。

### Fixed

- 文章阅读器在 760px 以下改为单栏整页滚动，推荐区域移动到正文之后，修复移动端仍保留桌面双栏导致正文被压缩为逐字换行的问题。
- 已包含块级 HTML 的 Hexo 正文不再被额外 `<p>` 包裹，避免标题、列表和代码块形成无效嵌套；独立文章页同时兼容 Hexo Query 分类集合与源目录回退，不再错误显示 `uncategorized`。

## [1.5.2] - 2026-09-11

### Changed

- 六个 `package.json` 的版本号随本次补丁发布统一升级为 `1.5.2`；README 原本就将文章阅读器描述为完整详情入口，经核对无需调整。

### Fixed

- Hexo 首页与归档页不再把已渲染正文截断到前 200 个字符后传入文章阅读器，修复弹层只能显示开头片段、且可能截断 HTML 标签的问题；首页摘要的条件表达式同时补充分组，确保优先使用 front matter 中的 `excerpt` 或 `description`。

## [1.5.1] - 2026-09-11

### Changed

- 六个 `package.json` 的版本号随本次补丁发布统一升级为 `1.5.1`；README 中现有的 Giscus 能力、配置字段和 SPA 映射说明经核对后仍与实现一致，无需调整。

### Fixed

- Giscus 客户端不再直接从 `article-viewer` 的 Shadow DOM 启动：改用命名插槽将 Light DOM 评论容器投影回阅读器，并从 Light DOM 加载官方脚本，解决 `document.currentScript` 为 `null` 导致评论 iframe 无法创建的问题；同时按文章与配置生成渲染键，避免同一文章重复渲染时并发加载脚本。

## [1.5.0] - 2026-09-11

### Added

- 文章详情阅读器新增默认启用的可配置 Giscus 评论：四套主题统一通过核心 Web Component 加载 GitHub Discussions，以稳定文章键执行 `specific` 映射，解决 Hash/Query SPA 使用 pathname 时多篇文章串评论的问题；切换推荐文章会同步重建对应评论会话，配置不完整时显示带直达链接的三步引导，显式禁用时保留原演示评论区。

### Changed

- 六个 `package.json` 的版本号随本次发布统一升级为 `1.5.0`，README 同步补充 Giscus 配置字段、启用前置条件与 SPA 映射说明。

## [1.4.0] - 2026-09-11

### Added

- React 主题新增 `/friends-demo` 友链设计展台，提供「人物画廊」「信号目录」「往来书信」三种可即时切换的响应式页面方案，用于在正式接入站点配置前比较信息密度与叙事方向。
- 四套主题统一接入 Vercount 访问统计：侧栏展示站点 PV / UV，首页列表通过只读 GET 接口动态回填每篇文章的阅读量；打开文章时使用稳定的 `/articles/{id}` 路径记录 PV，避免 SPA hash 路由导致文章计数混在同一页面下；站点、列表与阅读器计数在请求期间显示加载动效，请求失败后恢复本地回退值。

### Changed

- `site-sidebar` 新增可选 `friendsUrl` 一级导航及友链页面上下文，避免友链 demo 借用“关于我”或分类激活态而造成导航语义错误。
- 归档一级导航从位图资源改为与其他导航一致的线性 SVG 图标，解决线宽与视觉风格不统一的问题。
- 六个 `package.json` 的版本号随本次发布统一升级为 `1.4.0`。

### Fixed

- Vue `ArticleViewer` 包装层将 Web Component 的 `tag-select` 入参收窄为具体 `CustomEvent` 后与模板推断的 emit 回调签名冲突；改为边界处接收 `unknown` 再做类型收窄，恢复 `vue-tsc --noEmit` 通过。

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
