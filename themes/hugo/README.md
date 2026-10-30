# @soul-blog/hugo

Soul Blog Theme 的 Hugo 移植版。UI 全部来自 `@soul-blog/wc` 的 Web Components，本主题只提供 Go 模板壳。

**要求**：Hugo ≥ 0.146（本地用 0.169 extended 验证）。

## 安装

在 Hugo 站点里：

```bash
# 方式一：作为主题目录
git clone <repo> /tmp/soul-blog-theme
cp -r /tmp/soul-blog-theme/themes/hugo <你的站点>/themes/hugo

# 方式二：本地开发时直接指向仓库
# hugo.toml 里设 themesDir = '../../themes'
```

站点根 `hugo.toml`：

```toml
theme = 'hugo'

[params]
  icp = '@CallMeSoul 粤ICP备15053557'
  postsSection = 'posts'
```

主题的前端产物（`static/js`、`static/css`、`static/images`、`static/audio`）需要先在仓库内构建：

```bash
pnpm build:core
pnpm build:hugo
```

## 内容组织

```text
content/
├── posts/…          # 文章，front matter 用 categories / tags 标注分类与标签
├── about.md         # front matter: layout: about
├── friends.md       # front matter: layout: friends
└── archives.md      # front matter: layout: archives
```

文章的 `categories` 第一项即列表与侧栏使用的目录；`tags` 会进入侧栏标签云。日期取 front matter 的 `date`。

## 配置

全部写在 `hugo.toml` 的 `[params]` 下，字段语义与 Hexo 主题 `_config.yml` 一致：

| 字段 | 说明 |
| --- | --- |
| `icp` | 页脚备案文案 |
| `social` | 页脚社交图标数组，支持 `url` 或 `href`、`qr`、`hue`、`mono`、`width`、`height` |
| `giscus` | GitHub Discussions 评论，`repo` / `repo_id` / `category` / `category_id` / `term_prefix` 等 |
| `about` | 关于页文案与卡片，`title_accent`、`cards[].eyebrow/title/text/variant/href` |
| `friends` | 友链列表，`links[].name/url/domain/note/mark/color/avatar` |
| `postsSection` | 被视为文章的 section，默认 `posts`；留空则取全部非 about/friends/archives 页面 |
| `archivesPath` / `aboutPath` / `friendsPath` | 三个独立页面的路径，默认 `archives` / `about` / `friends` |
| `aboutEnabled` / `friendsEnabled` | 是否在侧栏暴露入口，默认 `true` |

`about` 与 `friends` 直接用 snake_case（`title_accent`），前端 `buildSiteData()` 会转成组件契约的 camelCase。

## 数据流

```text
layouts/partials/site-data.html
  → <script id="site-data"> 输出 RawSiteData（posts + 配置原样）
  → buildSiteData() 归一化（分类 slug、日期、摘要、标签统计、snake_case 映射）
  → mountSite() 装配组件 + 接管 #cat= / #tag= / #art= 路由
```

**不要在 Go 模板里写业务推导**。分类 slug、日期格式、摘要截断、标签统计、字段名映射都只在 `packages/core/src/helpers/build-site-data.ts` 有一份实现，Hexo 主题调用的是同一套。归档页同理：由 `<archive-list>` 组件渲染，模板不拼时间线。
