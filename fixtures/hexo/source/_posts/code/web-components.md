---
title: 用 Web Components 组织跨框架主题
date: 2026-09-14 10:00:00
tags:
  - Web Components
  - TypeScript
cover: /images/extracted/home/图层_21@2x.png
---

Soul Blog Theme 将核心界面沉淀为框架无关的 Web Components，再由 Vanilla、Vue、React 与 Hexo 负责路由和数据接入。

## 单一 UI 真源

组件样式、交互与类型契约集中维护，可以减少多套主题之间的视觉和行为偏差。

```ts
customElements.define('article-list', ArticleList)
```

这篇文章用于本地 Hexo 开发服务器的页面和富文本渲染验证。
