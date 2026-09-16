#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { create } from 'tar'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'themes/hexo')
const output = join(root, 'dist/hexo')
const packages = ['package.json', 'packages/core/package.json', ...['vanilla', 'vue', 'react', 'hexo'].map(name => `themes/${name}/package.json`)]
const version = JSON.parse(readFileSync(join(root, packages[0]))).version
for (const file of packages) {
  if (JSON.parse(readFileSync(join(root, file))).version !== version) throw new Error(`${file} 版本不一致`)
}
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const dirty = Boolean(execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim())
const tag = process.env.HEXO_RELEASE_TAG || process.env.GITHUB_REF_NAME
if (process.argv.includes('--release')) {
  if (tag !== `v${version}`) throw new Error(`发布 tag ${tag} 必须对应 v${version}`)
  if (dirty) throw new Error('正式发布必须使用干净的工作区')
  const latest = readFileSync(join(root, 'CHANGELOG.md'), 'utf8').match(/^## \[([^\]]+)\]/m)?.[1]
  if (latest !== version) throw new Error('CHANGELOG 最新条目必须是本次正式版本，先整理 Unreleased')
}

// 总是先构建，避免把其他提交遗留的产物打进发布包。
for (const script of ['build:core', 'build:hexo']) {
  execFileSync('pnpm', [script], { cwd: root, stdio: 'inherit' })
}
const temporary = mkdtempSync(join(tmpdir(), 'soul-hexo-package-'))
try {
  const theme = join(temporary, 'hexo')
  mkdirSync(theme)
  for (const path of ['layout', 'scripts', '_config.yml', 'source/js', 'source/css', 'source/images', 'source/audio']) {
    if (!existsSync(join(source, path))) throw new Error(`缺少运行文件 ${path}`)
    cpSync(join(source, path), join(theme, path), { recursive: true })
  }
  const metadata = { schema: 1, version, tag: `v${version}`, sha, dirty }
  writeFileSync(join(theme, 'theme.json'), JSON.stringify(metadata, null, 2) + '\n')
  // Hexo 的主题脚本是 CommonJS；运行包不携带 workspace 依赖及构建工具。
  writeFileSync(join(theme, 'package.json'), JSON.stringify({ name: '@soul-blog/hexo', version, private: true, type: 'commonjs' }, null, 2) + '\n')
  mkdirSync(output, { recursive: true })
  const archive = `soul-blog-hexo-v${version}.tar.gz`
  await create({ cwd: temporary, file: join(output, archive), gzip: true, portable: true }, ['hexo'])
  const sha256 = createHash('sha256').update(readFileSync(join(output, archive))).digest('hex')
  writeFileSync(join(output, 'hexo-release.json'), JSON.stringify({ ...metadata, archive, sha256 }, null, 2) + '\n')
  writeFileSync(join(output, 'SHA256SUMS'), `${sha256}  ${archive}\n`)
  console.log(`Hexo 运行包：${join(output, archive)}`)
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
