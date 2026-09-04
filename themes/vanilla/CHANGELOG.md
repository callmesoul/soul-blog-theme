# Changelog

本项目的所有值得注意的变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## \[Unreleased]

### Added

- 站内搜索：`Ctrl/Cmd + Shift + F` 全局快捷键打开搜索弹出层，支持模糊匹配文章标题 / 摘要 / 目录 / 正文，并提供 `↑ / ↓` 选择、`Enter` 打开、`Esc` 关闭等键盘导航。

- 首页文章列表右上角「搜索」入口胶囊，含 `Ctrl Shift F` 快捷键提示。

- 新增搜索结果页 `search.html`，读取 `?q=` 关键词实时渲染结果，支持结果计数与空状态。

- 新增 `README.md` 与 `CHANGELOG.md`，补充项目说明、快速开始、配置与数据接入文档。

## \[1.0.0] - 2026-09-05

### Added

- 基于 Vite + Tailwind CSS v4 + 原生 Web Components 的博客主题骨架。

- 首页文章列表：目录导航、卡片网格、分类筛选、加载后入场动画。

- 阅读器：FLIP 动画切换、段落 / 代码 / 引用渲染、评论点赞区。

- 站点背景：粒子 / 星尘动效背景层。

- 音乐播放器：播放 / 暂停、进度与音量控制、播放列表、跨目录保持播放状态。

- 登录页：密码显隐切换、错误提示。

- 主题配置化：`public/site-config.json`、`window.__SITE_CONFIG__` 与内置默认配置三级合并，支持 logo / 主色 / 社交栏 / 备案文案运行时替换。

- 响应式布局：侧栏可折叠，窄屏自适应。

