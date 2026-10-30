---
title: 欢迎来到 Soul Blog
date: 2026-09-16 09:30:00
categories: [diary]
tags:
  - 随笔
  - 设计
cover: /images/extracted/home/图层_21@2x.png
---

这里是仓库内置的 Hugo 开发夹具。运行 `pnpm dev:hugo` 后，它会直接使用当前仓库中的 Hugo 主题。

## 开发体验

- 主题资源由 Vite 持续构建
- Hugo 在 `http://localhost:1313` 提供页面预览
- 数据归一化由 `@soul-blog/wc` 的 `buildSiteData()` 统一承担，模板不重复实现规则
