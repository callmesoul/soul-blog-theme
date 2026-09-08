# Hexo 主题开发和测试流程

## 项目结构

项目使用 monorepo 结构：
- `packages/core/` — Web Components 核心组件（`@soul-blog/wc` 包）
- `themes/hexo/` — Hexo 主题（依赖 `@soul-blog/wc`）
- `themes/vanilla/` — 纯 HTML/CSS/JS 版本

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
