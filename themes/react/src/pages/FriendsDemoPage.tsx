import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useArticles } from '../stores/articles'
import { useSiteConfig } from '../stores/site-config'
import SiteSidebar from '../components/SiteSidebar'
import './friends-demo.css'

type DemoKey = 'gallery' | 'signals' | 'letters'

const friends = [
  { name: '木木木木木', domain: 'immmmm.com', note: '有趣的灵魂，持续记录设计、技术与生活。', topic: '设计与生活', mark: 'M', color: '#ed5a42' },
  { name: '保罗的小宇宙', domain: 'paugram.com', note: '写代码，也写那些值得被好好记住的瞬间。', topic: '前端开发', mark: 'P', color: '#ca8251' },
  { name: '林木木', domain: 'imlinmu.com', note: '热爱开源和摄影，相信长期主义的独立开发者。', topic: '开源创作', mark: 'L', color: '#6d8580' },
  { name: '青山', domain: 'qingshaner.com', note: '在山野、胶片和文字之间，寻找缓慢的答案。', topic: '摄影随笔', mark: 'Q', color: '#727a9a' },
  { name: '旧梦与诗', domain: 'dreamer.ink', note: '写诗，做产品，收集互联网仍然温柔的证据。', topic: '产品随笔', mark: 'D', color: '#a56c76' },
  { name: '未读消息', domain: 'unread.one', note: '关于阅读、播客和偶尔抵达远方的信。', topic: '阅读播客', mark: 'U', color: '#8b7656' },
]

const demos: { key: DemoKey; index: string; name: string; hint: string }[] = [
  { key: 'gallery', index: '01', name: '人物画廊', hint: '编辑感卡片' },
  { key: 'signals', index: '02', name: '信号目录', hint: '高密度索引' },
  { key: 'letters', index: '03', name: '往来书信', hint: '叙事型布局' },
]

function ArrowIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15 15 5M7 5h8v8" /></svg>
}

function GalleryDemo() {
  return (
    <section className="demo-panel gallery-demo" aria-labelledby="gallery-title">
      <div className="demo-heading">
        <div><p>Friends · Curated People</p><h2 id="gallery-title">一些值得<br /><em>反复拜访的人。</em></h2></div>
        <span className="demo-count">06<br /><small>LINKS</small></span>
      </div>
      <div className="friend-gallery">
        {friends.map((friend, index) => (
          <a className={`gallery-card gallery-card-${index + 1}`} href={`https://${friend.domain}`} target="_blank" rel="noreferrer" key={friend.domain}>
            <span className="card-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="friend-mark" style={{ '--mark': friend.color } as React.CSSProperties}>{friend.mark}</span>
            <span className="friend-copy"><strong>{friend.name}</strong><small>{friend.domain}</small><span>{friend.note}</span></span>
            <span className="card-arrow"><ArrowIcon /></span>
          </a>
        ))}
      </div>
    </section>
  )
}

function SignalsDemo() {
  return (
    <section className="demo-panel signals-demo" aria-labelledby="signals-title">
      <div className="signals-head">
        <div><p>Independent Web Directory</p><h2 id="signals-title">保持联络，<em>保持好奇。</em></h2></div>
        <div className="signal-status"><i /> 6 个信号在线</div>
      </div>
      <div className="signal-labels"><span>INDEX / NAME</span><span>FIELD</span><span>ADDRESS</span><span>VISIT</span></div>
      <div className="signal-list">
        {friends.map((friend, index) => (
          <a href={`https://${friend.domain}`} target="_blank" rel="noreferrer" className="signal-row" key={friend.domain}>
            <span className="signal-person"><b>{String(index + 1).padStart(2, '0')}</b><i style={{ '--signal': friend.color } as React.CSSProperties}>{friend.mark}</i><strong>{friend.name}</strong></span>
            <span className="signal-topic">{friend.topic}</span>
            <span className="signal-domain">{friend.domain}</span>
            <span className="signal-arrow"><ArrowIcon /></span>
          </a>
        ))}
      </div>
      <p className="signal-footnote">最后巡航 · 2026 / 09 / 11 <span>互联网上的小站仍在发光</span></p>
    </section>
  )
}

function LettersDemo() {
  return (
    <section className="demo-panel letters-demo" aria-labelledby="letters-title">
      <div className="letters-intro">
        <p>Letters Across The Web</p>
        <h2 id="letters-title">世界很大，<br />幸好我们<em>互相抵达。</em></h2>
        <span>这些链接不是收藏夹，而是一条条仍在继续的对话。</span>
      </div>
      <div className="letters-stack">
        {friends.slice(0, 4).map((friend, index) => (
          <a className="letter-card" href={`https://${friend.domain}`} target="_blank" rel="noreferrer" key={friend.domain}>
            <span className="letter-no">LETTER {String(index + 1).padStart(2, '0')}</span>
            <span className="letter-stamp" style={{ '--stamp': friend.color } as React.CSSProperties}>{friend.mark}</span>
            <blockquote>“{friend.note}”</blockquote>
            <span className="letter-sign"><strong>{friend.name}</strong><small>{friend.domain}</small></span>
            <span className="letter-open">READ THEIR STORY <ArrowIcon /></span>
          </a>
        ))}
      </div>
    </section>
  )
}

export default function FriendsDemoPage() {
  const [activeDemo, setActiveDemo] = useState<DemoKey>('gallery')
  const navigate = useNavigate()
  const articles = useArticles()
  const siteConfig = useSiteConfig()

  const handleNavigate = useCallback((cat: string, tag?: string) => {
    navigate('/' + (tag ? `#tag=${encodeURIComponent(tag)}` : `#cat=${encodeURIComponent(cat)}`))
  }, [navigate])

  return (
    <>
      <SiteSidebar categories={articles.categories} tags={articles.tags} social={siteConfig.social} siteName={siteConfig.siteName} icp={siteConfig.icp} activeCat="friends" onNavigate={handleNavigate} />
      <main className="friends-demo-shell">
        <header className="demo-switcher">
          <div className="switcher-title"><small>FRIENDS PAGE · DESIGN STUDY</small><strong>友链页面提案</strong></div>
          <div className="demo-tabs" role="tablist" aria-label="切换友链页面设计">
            {demos.map(demo => <button type="button" role="tab" aria-selected={activeDemo === demo.key} className={activeDemo === demo.key ? 'active' : ''} onClick={() => setActiveDemo(demo.key)} key={demo.key}><span>{demo.index}</span><b>{demo.name}</b><small>{demo.hint}</small></button>)}
          </div>
        </header>
        <div className="demo-stage">
          {activeDemo === 'gallery' && <GalleryDemo />}
          {activeDemo === 'signals' && <SignalsDemo />}
          {activeDemo === 'letters' && <LettersDemo />}
        </div>
      </main>
    </>
  )
}
