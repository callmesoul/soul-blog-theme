# soul-blog-theme 开发、测试与发布流程

## 项目结构

项目使用 monorepo 结构：
- `packages/core/` — Web Components 核心组件（`@soul-blog/wc` 包）
- `themes/hexo/` — Hexo 主题（依赖 `@soul-blog/wc`）
- `themes/vanilla/` — 纯 HTML/CSS/JS 版本
- `themes/vue/` — Vue 3 主题
- `themes/react/` — React 18 主题

## 提交与发布规范（强制）

**每次提交 / 发布前，必须完成「改版本号 → 更新 CHANGELOG → 核对 README」三步，确认无误后再 `git commit`。**

### 1. 更新版本号（全仓统一）

下面 6 个 `package.json` 的 `version` 必须始终保持一致，并且与 `CHANGELOG.md` 的最新版本条目对应，**不允许出现 CHANGELOG 已到 1.2.0、package.json 还停在 1.0.0 的情况**：

| 文件 | 包名 |
| --- | --- |
| `package.json` | `soul-blog-theme`（根，private） |
| `packages/core/package.json` | `@soul-blog/wc` |
| `themes/vanilla/package.json` | `@soul-blog/vanilla` |
| `themes/vue/package.json` | `@soul-blog/vue` |
| `themes/react/package.json` | `@soul-blog/react` |
| `themes/hexo/package.json` | `@soul-blog/hexo` |

一键统一（在 WSL 内执行；Git Bash 环境无 `perl`）：

```bash
# 把 1.2.0 替换为本次目标版本
cd /home/callmesoul/code/soul-blog-theme
for f in package.json packages/core/package.json \
         themes/vanilla/package.json themes/vue/package.json \
         themes/react/package.json themes/hexo/package.json; do
  sed -i 's/"version": "[^"]*"/"version": "1.2.0"/' "$f"
done
```

版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- **major** — 破坏性变更：组件属性 / 事件 / 类型契约不兼容改动
- **minor** — 新增组件、新增页面或路由、向后兼容的能力增强
- **patch** — 纯 bug 修复、样式回归修复、文档更新

### 2. 更新 CHANGELOG.md

- 所有值得注意的变更都要落进 `CHANGELOG.md`，条目按 `Added` / `Changed` / `Fixed` 分组
- 每条要写清**改了什么 + 根因是什么**，不要只写「修复 bug」「优化样式」
- 正式发布：把 `## [Unreleased]` 转成 `## [x.y.z] - YYYY-MM-DD`，版本号与第 1 步一致
- 尚未提交 / 未验证的功能先留在 `## [Unreleased]`，不要提前写进正式版本号
- 仅文档 / 版本号变更也应在 `Changed` 中留一条记录

### 3. 核对并更新 README.md

有新增或变更能力时，逐项核对以下位置是否与代码现状一致，不一致就改：

- [ ] `## ✨ 特性` — 新增页面 / 能力是否补了条目
- [ ] `## 📸 截图预览` — 是否要新增或重拍截图（规格 **1424×749**，统一从 React 端 `http://localhost:5176` 取图）
- [ ] `## 🗂️ 项目架构` — `components/` 注释里的组件总数
- [ ] `## 组件清单` — 表格是否覆盖全部 Web Components
- [ ] `## 路由 & 页面` — 路由表是否覆盖全部页面
- [ ] `## 站点配置` — 新增配置项是否补了字段示例
- [ ] `## 技术栈` / `## 本地开发` — 依赖版本、默认端口是否与现状一致

> **截图注意**：WSL 内的 headless chromium 默认无中文字体，会把中文渲染成方块。取图前先补字体（免 sudo）：
> ```bash
> mkdir -p ~/.local/share/fonts
> cp /mnt/c/Windows/Fonts/msyh.ttc /mnt/c/Windows/Fonts/msyhbd.ttc ~/.local/share/fonts/
> fc-cache -f ~/.local/share/fonts
> ```

### 4. 提交

确认以上三步完成后再提交。提交信息使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

```
feat(core): 新增 about-page 组件
fix(vue): 修复阅读器内点击 tag 白屏
docs: 更新 README 与 CHANGELOG
chore(release): 发布 v1.2.0
```

scope 取值：`core` / `vanilla` / `vue` / `react` / `hexo`；根仓库级改动（文档、版本号）可省略 scope。

## 开发流程

### 1. 修改核心组件 (`packages/core/`)
修改组件源码后，必须重新构建：
```bash
cd packages/core
pnpm build
```

### 2. 修改 Hexo 主题 (`themes/hexo/`)
修改主题源码（EJS/CSS/JS）后，必须重新构建主题：
```bash
cd themes/hexo
pnpm build
```
构建输出到 `themes/hexo/source/` 目录。

### 3. 同步到 Hexo 测试站点
测试站点位于 `/tmp/hexo-test/`，需要同步构建好的主题：
```bash
rm -rf /tmp/hexo-test/themes/hexo/
cp -r /home/callmesoul/code/soul-blog-theme/themes/hexo /tmp/hexo-test/themes/
cd /tmp/hexo-test
hexo clean
hexo generate
```

### 4. 启动/重启 Hexo 服务
```bash
# 杀掉旧进程，启动新服务
fuser -k 4000/tcp 2>/dev/null
sleep 2
cd /tmp/hexo-test
hexo server -p 4000
```

### 5. 浏览器验证
打开 `http://localhost:4000/`，必须使用 **硬刷新** 加载最新文件：
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

## 常见坑点

1. **忘记重新构建 `themes/hexo`**
   - 修改 `packages/core` 后，`themes/hexo` 导入的是 npm 包链接，必须重新构建才能包含新代码
   - 否则浏览器加载的还是旧 `main.js`，修改不生效

2. **浏览器缓存**
   - Hexo 生成后文件名不变，浏览器会缓存旧文件
   - 必须硬刷新才能看到修改

3. **端口占用**
   - 重启服务时需要先杀掉占用 4000 端口的旧进程
   - 使用 `fuser -k 4000/tcp` 杀掉

4. **图片/静态资源路径**
   - 所有图片放在 `themes/hexo/source/images/` 下
   - CSS/JS 输出到 `themes/hexo/source/css/` 和 `js/`

## 完整命令速查（一次修改完整流程）

```bash
# 1. 构建 core
cd /home/callmesoul/code/soul-blog-theme/packages/core
pnpm build

# 2. 构建 hexo 主题
cd /home/callmesoul/code/soul-blog-theme/themes/hexo
pnpm build

# 3. 同步到测试站，重新生成
rm -rf /tmp/hexo-test/themes/hexo/
cp -r /home/callmesoul/code/soul-blog-theme/themes/hexo /tmp/hexo-test/themes/
cd /tmp/hexo-test
hexo clean
hexo generate

# 4. 重启服务
fuser -k 4000/tcp 2>/dev/null
sleep 2
hexo server -p 4000 &
```

然后浏览器硬刷新 `http://localhost:4000/`。
