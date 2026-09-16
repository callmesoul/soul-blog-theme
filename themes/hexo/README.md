# Soul Blog Theme for Hexo

A dark, responsive Hexo theme powered by Web Components, with immersive reading,
search, music playback, archives, about and friends pages, and Giscus comments.

- Demo: https://callmesoul.github.io/
- Source: https://github.com/callmesoul/soul-blog-theme
- Runtime downloads: https://github.com/callmesoul/soul-blog-theme/releases

## Install in an existing Hexo site

The runtime archive includes templates, scripts, compiled JS/CSS, default images,
music, this guide and the MIT license. No pnpm, Vite or monorepo build is needed
in your blog. Use Node 24 and Hexo 7 or 8.

Run these commands in your Hexo site's root. The example installs v1.9.1; replace
the version with the desired packaged release. For an existing installation,
read the update section before extracting.

```bash
npm install hexo-renderer-ejs
mkdir -p themes
curl -fL -o soul-blog-hexo-v1.9.1.tar.gz \
  https://github.com/callmesoul/soul-blog-theme/releases/download/v1.9.1/soul-blog-hexo-v1.9.1.tar.gz
curl -fL -o SHA256SUMS \
  https://github.com/callmesoul/soul-blog-theme/releases/download/v1.9.1/SHA256SUMS
sha256sum -c SHA256SUMS
tar -xzf soul-blog-hexo-v1.9.1.tar.gz -C themes
```

Set your site's `_config.yml`:

```yaml
theme: hexo
```

Then generate or preview:

```bash
npx hexo clean
npx hexo generate
npx hexo server
```

Open http://localhost:4000/. The source-code archive from GitHub is not a runtime
archive; it requires building Core and the Hexo adapter in the monorepo first.

## Configure

Hexo supports site-owned overrides in `_config.hexo.yml`, outside the theme folder.
For example:

```yaml
icp: 'My blog'
giscus:
  enabled: false
about:
  enabled: true
  title: Hello,
  title_accent: welcome to my blog.
friends:
  enabled: false
```

Set the title, author, URL, language and permalink in your site's `_config.yml`.
Review `themes/hexo/_config.yml` for categories, social links, Giscus, about and
friends options. Replace demo social/contact information with your own.
Put personal images and audio in your site's `source/images/` and `source/audio/`.
Use a distinct path such as `/images/personal/avatar.png` to avoid collisions with
theme defaults. The current templates serve assets from `/`, so deploy the blog
at your domain root.

Hexo's native configuration merge combines array entries by index. For complete
array replacement, including clearing social/friends lists, use the example
installer below rather than relying on the native override merge.

## Update

Keep personal configuration and assets outside `themes/hexo/`. Back up any files
you previously edited inside it, prepare the new release in a separate directory,
then replace the old theme directory in full. Restore any required personal
changes, run `npx hexo clean` and regenerate. Whole-directory replacement removes
obsolete files; simply extracting over an old installation can leave stale files.

An automatic installer example is maintained in
[callmesoul.github.io](https://github.com/callmesoul/callmesoul.github.io):
`tools/theme-update.mjs`, `tools/theme-sync.mjs` and `tools/lib/theme.mjs`.
It uses `THEME_REVISION`, `theme/config.yml`, `theme/assets/`, and the `js-yaml`/`tar`
dependencies. It verifies the package checksum/version/commit, replaces arrays
entirely, preserves personal content, and restores the previous theme on failure.
`npm run theme:update` is provided by that example site, not by a bare Hexo install.

## License

MIT. See the included `LICENSE`.
