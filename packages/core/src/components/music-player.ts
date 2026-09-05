import { WcBase } from '../helpers/wc-base'
import { escapeHtml } from '../helpers/escape-html'
import { formatTime } from '../helpers/format-time'
import { store } from '../helpers/store'

export interface Track {
  title: string
  artist: string
  src: string
  duration?: number
}

const PLAY_MODES = ['loop', 'single', 'shuffle'] as const
type PlayMode = typeof PLAY_MODES[number]

const DEFAULT_TRACKS: Track[] = [
  { title: 'SoundHelix Song 1', artist: 'SoundHelix', src: '/audio/SoundHelix-Song-1.mp3' },
  { title: 'SoundHelix Song 2', artist: 'SoundHelix', src: '/audio/SoundHelix-Song-2.mp3' },
  { title: 'SoundHelix Song 3', artist: 'SoundHelix', src: '/audio/SoundHelix-Song-3.mp3' },
  { title: 'SoundHelix Song 4', artist: 'SoundHelix', src: '/audio/SoundHelix-Song-4.mp3' },
  { title: 'SoundHelix Song 5', artist: 'SoundHelix', src: '/audio/SoundHelix-Song-5.mp3' }
]

/**
 * 音乐播放器组件
 *
 * 属性（JS property）：
 *   tracks — Track[] 曲目列表
 *
 * 事件：
 *   track-change — 曲目切换时触发，detail 为 { index: number, track: Track }
 */
class MusicPlayer extends WcBase {
  static get observedAttributes (): string[] {
    return []
  }

  private _tracks: Track[] = DEFAULT_TRACKS
  private _index = 0
  private _isPlaying = false
  private _current = 0
  private _volume = 0.5
  private _mode: PlayMode = 'loop'
  private _lastVolume = 0.5
  private _audio: HTMLAudioElement | null = null
  private _listPanel: HTMLElement | null = null
  private _volumePanel: HTMLElement | null = null

  set tracks (val: Track[]) {
    this._tracks = val
    this._updateInfo()
  }

  get currentTrack (): Track { return this._tracks[this._index] || this._tracks[0] }

  protected render (): string {
    return `
      <style>
        :host {
          display: flex;
          position: relative;
          z-index: 30;
          height: 50px;
          min-height: 50px;
          flex-shrink: 0;
          background: rgba(0,0,0,0.42);
          backdrop-filter: blur(16px) saturate(120%);
          -webkit-backdrop-filter: blur(16px) saturate(120%);
        }
        .player-inner {
          display: flex;
          flex: 1;
          align-items: center;
          height: 100%;
          border-top: 1px solid rgba(255,255,255,0.16);
          padding: 0 32px;
        }
        .player-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          color: #9e9d99;
          transition: background 0.18s ease, color 0.18s ease, transform 0.15s ease;
          position: relative;
          -webkit-tap-highlight-color: transparent;
        }
        .player-btn:focus { outline: none; }
        .player-btn:focus-visible {
          outline: 2px solid rgba(var(--brand-rgb), 0.6);
          outline-offset: 2px;
        }
        .player-btn:active { transform: scale(0.94); }
        .player-btn svg { display: block; }
        .player-btn svg path,
        .player-btn svg rect,
        .player-btn svg polygon,
        .player-btn svg circle {
          fill: currentColor;
          stroke: currentColor;
          transition: fill 0.18s ease, stroke 0.18s ease;
        }
        .player-controls {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .player-btn.is-control {
          width: 32px;
          height: 32px;
          color: #b3b3b3;
        }
        .player-btn.is-control:hover {
          color: #ffffff;
          background: rgba(255,255,255,0.06);
        }
        .player-btn.is-control:active {
          color: var(--brand-primary);
        }
        .player-btn.is-primary {
          width: 32px;
          height: 32px;
          background: var(--brand-primary);
          color: #ffffff;
          border-radius: 50%;
          box-shadow: 0 3px 10px rgba(var(--brand-rgb), 0.32);
          margin: 0 4px;
          transition: background 0.18s ease, color 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease;
        }
        .player-btn.is-primary:hover {
          background: #ff5a41;
          color: #ffffff;
          transform: scale(1.08);
          box-shadow: 0 5px 14px rgba(var(--brand-rgb), 0.45);
        }
        .player-btn.is-primary:active {
          transform: scale(0.95);
          background: #d9452e;
          box-shadow: 0 2px 8px rgba(var(--brand-rgb), 0.4);
        }
        .player-btn.is-primary .icon-play,
        .player-btn.is-primary .icon-pause {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          transition: opacity 0.15s ease, transform 0.2s ease;
        }
        .player-btn.is-primary .icon-pause {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.6);
        }
        .player-btn.is-primary.is-playing .icon-play {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.6);
        }
        .player-btn.is-primary.is-playing .icon-pause {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        .player-btn.is-primary.is-playing::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1.5px solid rgba(var(--brand-rgb), 0.35);
          animation: playerPulse 1.6s ease-out infinite;
          pointer-events: none;
        }
        @keyframes playerPulse {
          0%   { transform: scale(0.95); opacity: 0.9; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        .player-btn.volume-btn {
          width: 32px;
          height: 32px;
          color: #b3b3b3;
        }
        .player-btn.volume-btn:hover {
          color: #ffffff;
          background: rgba(255,255,255,0.06);
        }
        .player-btn.volume-btn:active {
          color: var(--brand-primary);
        }
        .player-btn.volume-btn .icon-mute { display: none; }
        .player-btn.volume-btn .icon-volume { display: block; }
        .player-btn.volume-btn.is-muted .icon-volume { display: none; }
        .player-btn.volume-btn.is-muted .icon-mute { display: block; color: var(--brand-primary); }
        .player-btn.mode-toggle {
          width: 34px;
          height: 32px;
        }
        .player-btn.mode-toggle svg {
          display: block;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .player-btn.mode-toggle .mode-glyph path {
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .player-btn.mode-toggle.is-mode-active {
          color: var(--brand-primary);
          background: rgba(var(--brand-rgb), 0.12);
        }
        .player-btn.mode-toggle.is-mode-active:hover,
        .player-btn.mode-toggle.is-mode-active:focus-visible {
          color: #ff6a50;
          background: rgba(var(--brand-rgb), 0.2);
        }
        .mode-toggle.is-mode-active svg { transform: scale(1.05); }
        .mode-toggle.is-switch svg { animation: mode-pop 0.4s cubic-bezier(0.22, 1.4, 0.36, 1); }
        @keyframes mode-pop {
          0%   { transform: rotate(-14deg) scale(0.8); }
          60%  { transform: rotate(4deg) scale(1.14); }
          100% { transform: rotate(0) scale(1.05); }
        }
        .player-btn[data-mode="shuffle"] {
          color: var(--brand-primary);
        }
        .player-btn[data-mode="shuffle"]:hover {
          color: #ff5a41;
        }
        .player-btn.is-pill {
          background: #1d1d1d;
          border-radius: 12px;
          padding: 4px 10px;
          display: flex;
          align-items: center;
          gap: 5px;
          color: #9e9d99;
        }
        .player-btn.is-pill:hover {
          background: #2a2a2a;
          color: #ffffff;
          transform: none;
        }
        .player-btn.is-pill:active { transform: scale(0.97); }
        .player-btn.is-pill span {
          font-family: var(--font-sans);
          font-size: 12px;
          color: inherit;
          font-variant-numeric: tabular-nums;
        }
        .player-btn.is-pill.open {
          background: var(--brand-primary);
          color: #ffffff;
        }
        .player-center {
          margin: 0 32px;
          min-width: 0;
          flex: 1;
        }
        .track-info {
          margin-bottom: 6px;
          line-height: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .track-title, .track-artist {
          font-family: var(--font-sans);
          font-size: 12px;
          color: #9e9d99;
          line-height: 1;
          letter-spacing: 0.01em;
        }
        .track-title {
          color: #f2f2f2;
          font-weight: 500;
        }
        .track-sep {
          margin: 0 6px;
          color: #5d5a59;
        }
        .progress-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .time-current, .time-duration {
          min-width: 32px;
          font-size: 11px;
          line-height: 1;
          color: #6b6b6b;
          font-variant-numeric: tabular-nums;
        }
        .time-duration {
          text-align: right;
        }
        .progress-track {
          position: relative;
          flex: 1;
          height: 4px;
          background: #2a2a2a;
          border-radius: 4px;
          cursor: pointer;
          transition: height 0.15s ease;
        }
        .progress-track:hover { height: 6px; }
        .progress-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 0;
          background: linear-gradient(90deg, #6b6b6b, #9e9d99);
          border-radius: 4px;
          pointer-events: none;
          transition: width 0.05s linear;
        }
        .progress-thumb {
          position: absolute;
          top: 50%;
          left: 0;
          transform: translate(-50%, -50%);
          width: 11px;
          height: 11px;
          background: #ffffff;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease, left 0.05s linear;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.1);
          pointer-events: none;
        }
        .progress-track:hover .progress-thumb { opacity: 1; }
        .progress-track.is-dragging .progress-thumb { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
      </style>
      <div class="player-inner">
        <div class="player-controls">
          <button class="player-btn is-control" data-act="prev" aria-label="上一首" title="上一首">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 5L4 11l7 6V5z" fill="currentColor"/>
            <rect x="3.5" y="5" width="2" height="12" rx="0.6" fill="currentColor"/>
            <rect x="16.5" y="5" width="2" height="12" rx="0.6" fill="currentColor"/>
          </svg>
        </button>
        <button class="player-btn is-primary" data-act="play" aria-label="播放" title="播放/暂停">
          <svg class="icon-play" width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 3.5L16.5 10 5 16.5V3.5z" fill="currentColor"/></svg>
          <svg class="icon-pause" width="16" height="16" viewBox="0 0 20 20" fill="none">
            <rect x="5" y="3.5" width="3" height="13" rx="0.8" fill="currentColor"/>
            <rect x="12" y="3.5" width="3" height="13" rx="0.8" fill="currentColor"/>
          </svg>
        </button>
        <button class="player-btn is-control" data-act="next" aria-label="下一首" title="下一首">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 5l7 6-7 6V5z" fill="currentColor"/>
            <rect x="3.5" y="5" width="2" height="12" rx="0.6" fill="currentColor"/>
            <rect x="16.5" y="5" width="2" height="12" rx="0.6" fill="currentColor"/>
          </svg>
        </button>
      </div>
      <div class="player-center">
        <div class="track-info">
          <span class="track-title" data-part="title">SoundHelix Song 1</span>
          <span class="track-sep">·</span>
          <span class="track-artist" data-part="artist">SoundHelix</span>
        </div>
        <div class="progress-row">
          <span class="time-current" data-part="current">00:00</span>
          <div class="progress-track" data-part="progress">
            <div class="progress-fill" data-part="fill"></div>
            <div class="progress-thumb" data-part="thumb"></div>
          </div>
          <span class="time-duration" data-part="duration">00:00</span>
        </div>
      </div>
      <button class="player-btn volume-btn" data-act="volume" aria-label="音量" title="音量">
        <svg class="icon-volume" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M2.5 7v6h3.2l4.3 3.6V3.4L5.7 7H2.5z" fill="currentColor"/>
          <path class="wave wave-1" d="M12.5 6.5a4.5 4.5 0 010 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/>
          <path class="wave wave-2" d="M14.8 4.8a7 7 0 010 10.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/>
        </svg>
        <svg class="icon-mute" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M2.5 7v6h3.2l4.3 3.6V3.4L5.7 7H2.5z" fill="currentColor"/>
          <path d="M13 8l4 4M17 8l-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </button>
      <button class="player-btn mode-toggle" data-part="mode-btn" data-mode="loop" aria-label="列表循环">
        <svg class="mode-glyph" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>
        </svg>
      </button>
      <button class="player-btn is-pill" data-act="list" aria-label="播放列表">
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
          <rect x="2" y="3" width="13" height="2" rx="1" fill="currentColor"/>
          <rect x="2" y="7" width="13" height="2" rx="1" fill="currentColor"/>
          <rect x="2" y="11" width="8" height="2" rx="1" fill="currentColor"/>
        </svg>
        <span data-part="list-count">${this._tracks.length}</span>
      </button>
      </div>
    `
  }

  protected mounted (): void {
    this._initAudio()
    this._bindButtons()
    this._bindProgress()
    this._bindVolume()
    this._bindKeyboard()
    this._prefillDurations()
    this._updateInfo()
  }

  // ===== 音频引擎 =====
  private _initAudio (): void {
    const audio = new Audio()
    audio.preload = 'metadata'
    this._volume = store.get('player:volume', 0.5)
    audio.volume = this._volume
    audio.src = this._tracks[0]?.src || ''

    audio.addEventListener('play', () => { this._isPlaying = true; this._syncPlayIcon() })
    audio.addEventListener('pause', () => { this._isPlaying = false; this._syncPlayIcon() })
    audio.addEventListener('timeupdate', () => {
      this._current = audio.currentTime
      this._updateProgress()
    })
    audio.addEventListener('durationchange', () => {
      const t = this._tracks[this._index]
      if (audio.duration && isFinite(audio.duration)) t.duration = audio.duration
      this._updateInfo()
    })
    audio.addEventListener('ended', () => {
      if (this._mode === 'single') {
        audio.currentTime = 0
        audio.play().catch(() => {})
      } else {
        this._loadTrack(this._nextIndex(), true)
      }
    })
    audio.addEventListener('error', () => { this._isPlaying = false; this._syncPlayIcon() })

    this._audio = audio
  }

  // ===== 按钮事件 =====
  private _bindButtons (): void {
    this.$('[data-act="prev"]')?.addEventListener('click', () => this._prev())
    this.$('[data-act="play"]')?.addEventListener('click', () => this._toggle())
    this.$('[data-act="next"]')?.addEventListener('click', () => this._next())
    this.$('[data-part="mode-btn"]')?.addEventListener('click', () => this._cycleMode())
    this.$('[data-act="volume"]')?.addEventListener('click', (e: Event) => {
      e.stopPropagation()
      this._toggleVolumePanel()
    })
    this.$('[data-act="list"]')?.addEventListener('click', (e: Event) => {
      e.stopPropagation()
      this._toggleList()
    })
  }

  // ===== 进度条 =====
  private _bindProgress (): void {
    const track = this.$('[data-part="progress"]') as HTMLElement | null
    if (!track) return

    let dragging = false
    const seek = (e: MouseEvent | TouchEvent) => {
      const rect = track.getBoundingClientRect()
      const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left
      const ratio = Math.max(0, Math.min(1, x / rect.width))
      const t = this._tracks[this._index]
      const sec = ratio * (t.duration || 0)
      this._current = sec
      if (this._audio) this._audio.currentTime = sec
      this._updateProgress()
    }

    track.addEventListener('mousedown', (e: MouseEvent) => {
      dragging = true
      track.classList.add('is-dragging')
      seek(e)
      e.preventDefault()
    })
    document.addEventListener('mousemove', (e: MouseEvent) => { if (dragging) seek(e) })
    document.addEventListener('mouseup', () => { if (dragging) { dragging = false; track.classList.remove('is-dragging') } })
    track.addEventListener('touchstart', (e: TouchEvent) => { dragging = true; track.classList.add('is-dragging'); seek(e) }, { passive: true })
    document.addEventListener('touchmove', (e: TouchEvent) => { if (dragging) seek(e) }, { passive: true })
    document.addEventListener('touchend', () => { if (dragging) { dragging = false; track.classList.remove('is-dragging') } })
  }

  // ===== 音量面板 =====
  private _bindVolume (): void {
    // 音量面板延迟创建，在首次点击时初始化
    this._updateVolumeUI()
  }

  private _ensureVolumePanel (): HTMLElement {
    if (this._volumePanel) {
      this._updateVolumeUI()
      return this._volumePanel
    }

    const panel = document.createElement('div')
    panel.className = 'volume-panel'
    panel.innerHTML = `
      <style>
        .volume-panel {
          position: fixed;
          z-index: 60;
          background: #141210;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 12px 16px;
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.65);
          display: none;
          animation: panelIn 0.16s ease-out;
        }
        .volume-panel.open { display: block; }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .volume-panel-inner {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #9e9d99;
        }
        .volume-slider {
          width: 140px;
          display: flex;
          align-items: center;
        }
        .volume-slider-track {
          position: relative;
          flex: 1;
          height: 4px;
          background: #2a2a2a;
          border-radius: 4px;
          cursor: pointer;
          transition: height 0.15s ease;
        }
        .volume-slider-track:hover { height: 6px; }
        .volume-slider-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 50%;
          background: linear-gradient(90deg, #6b6b6b, var(--brand-primary));
          border-radius: 4px;
          pointer-events: none;
        }
        .volume-slider-thumb {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          background: #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .volume-slider-track:hover .volume-slider-thumb,
        .volume-panel.is-dragging .volume-slider-thumb {
          opacity: 1;
        }
        .volume-panel.is-dragging .volume-slider-thumb {
          transform: translate(-50%, -50%) scale(1.15);
        }
        .volume-pct {
          font-family: var(--font-sans);
          font-size: 12px;
          color: #ffffff;
          min-width: 36px;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
      </style>
      <div class="volume-panel-inner">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <path d="M2.5 7v6h3.2l4.3 3.6V3.4L5.7 7H2.5z" fill="currentColor"/>
          <path d="M12.5 6.5a4.5 4.5 0 010 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/>
        </svg>
        <div class="volume-slider">
          <div class="volume-slider-track" data-part="vol-track">
            <div class="volume-slider-fill" data-part="vol-fill"></div>
            <div class="volume-slider-thumb" data-part="vol-thumb"></div>
          </div>
        </div>
        <span class="volume-pct" data-part="vol-pct">50%</span>
      </div>
    `
    document.body.appendChild(panel)

    // 拖动逻辑
    const slider = panel.querySelector('[data-part="vol-track"]') as HTMLElement
    let dragging = false
    const seek = (e: MouseEvent | TouchEvent) => {
      const rect = slider.getBoundingClientRect()
      const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left
      const ratio = Math.max(0, Math.min(1, x / rect.width))
      this._setVolume(ratio)
      this._updateVolumeUI()
    }
    slider.addEventListener('mousedown', (e: MouseEvent) => {
      dragging = true
      panel.classList.add('is-dragging')
      seek(e)
      e.preventDefault()
    })
    document.addEventListener('mousemove', (e: MouseEvent) => { if (dragging) seek(e) })
    document.addEventListener('mouseup', () => { if (dragging) { dragging = false; panel.classList.remove('is-dragging') } })
    slider.addEventListener('touchstart', (e: TouchEvent) => { dragging = true; panel.classList.add('is-dragging'); seek(e) }, { passive: true })
    document.addEventListener('touchmove', (e: TouchEvent) => { if (dragging) seek(e) }, { passive: true })
    document.addEventListener('touchend', () => { if (dragging) { dragging = false; panel.classList.remove('is-dragging') } })

    // 点击面板外关闭
    const volBtn = this.$('[data-act="volume"]')
    document.addEventListener('click', (e: Event) => {
      if (!panel.classList.contains('open')) return
      if (panel.contains(e.target as Node) || (volBtn && volBtn.contains(e.target as Node))) return
      panel.classList.remove('open')
    })

    this._volumePanel = panel
    this._updateVolumeUI()
    return panel
  }

  private _setVolume (v: number, persist = true): void {
    this._volume = Math.max(0, Math.min(1, v))
    if (this._audio) this._audio.volume = this._volume
    if (this._volume > 0) this._lastVolume = this._volume
    if (persist) store.set('player:volume', this._volume)
  }

  private _updateVolumeUI (): void {
    const pct = Math.round(this._volume * 100)
    const volBtn = this.$('[data-act="volume"]')
    if (volBtn) {
      volBtn.classList.toggle('is-muted', this._volume === 0)
    }
    if (this._volumePanel) {
      const fill = this._volumePanel.querySelector('[data-part="vol-fill"]') as HTMLElement | null
      const thumb = this._volumePanel.querySelector('[data-part="vol-thumb"]') as HTMLElement | null
      const pctEl = this._volumePanel.querySelector('[data-part="vol-pct"]') as HTMLElement | null
      if (fill) fill.style.width = pct + '%'
      if (thumb) thumb.style.left = pct + '%'
      if (pctEl) pctEl.textContent = pct + '%'
    }
  }

  private _toggleVolumePanel (): void {
    const panel = this._ensureVolumePanel()
    this._updateVolumeUI()
    const volBtn = this.$('[data-act="volume"]') as HTMLElement | null
    if (volBtn) {
      const r = volBtn.getBoundingClientRect()
      const pw = panel.offsetWidth || 200
      panel.style.left = Math.max(8, Math.min(window.innerWidth - pw - 8, r.left + r.width / 2 - pw / 2)) + 'px'
      panel.style.bottom = (window.innerHeight - r.top + 8) + 'px'
    }
    panel.classList.toggle('open')
  }

  // ===== 播放列表面板 =====
  private _ensureListPanel (): HTMLElement {
    if (this._listPanel) return this._listPanel

    const panel = document.createElement('div')
    panel.className = 'playlist-panel'
    panel.innerHTML = `
      <style>
        .playlist-panel {
          position: fixed;
          right: 32px;
          bottom: 60px;
          width: 340px;
          max-height: 420px;
          background: #0f0e0d;
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
          display: none;
          flex-direction: column;
          z-index: 50;
          overflow: hidden;
          animation: panelIn 0.18s ease-out;
        }
        .playlist-panel.open { display: flex; }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .playlist-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 16px;
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.06em;
          color: #ffffff;
          border-bottom: 1px solid #2a2a2a;
          background: #0a0a0a;
        }
        .playlist-count {
          font-family: var(--font-sans);
          font-size: 11px;
          color: #6b6b6b;
          font-variant-numeric: tabular-nums;
        }
        .playlist-body {
          overflow-y: auto;
          max-height: 360px;
        }
        .playlist-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          cursor: pointer;
          border-bottom: 1px solid #1a1a1a;
          transition: background 0.15s ease;
        }
        .playlist-item:last-child { border-bottom: none; }
        .playlist-item:hover { background: rgba(255,255,255,0.04); }
        .playlist-item.active { background: rgba(var(--brand-rgb), 0.12); }
        .playlist-item.active .playlist-title { color: var(--brand-primary); }
        .playlist-index {
          width: 18px;
          text-align: center;
          font-family: var(--font-sans);
          font-size: 11px;
          color: #6b6b6b;
          flex-shrink: 0;
          font-variant-numeric: tabular-nums;
        }
        .playlist-item.active .playlist-index { color: var(--brand-primary); }
        .playlist-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .playlist-title {
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.01em;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
        }
        .playlist-artist {
          font-family: var(--font-sans);
          font-size: 10px;
          color: #6b6b6b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
        }
        .playlist-duration {
          font-family: var(--font-sans);
          font-size: 10px;
          color: #6b6b6b;
          flex-shrink: 0;
          font-variant-numeric: tabular-nums;
        }
        .playlist-playing {
          display: none;
          align-items: flex-end;
          gap: 2px;
          width: 12px;
          height: 12px;
          flex-shrink: 0;
        }
        .playlist-item.active .playlist-playing { display: flex; }
        .playlist-playing span {
          display: inline-block;
          width: 2px;
          background: var(--brand-primary);
          border-radius: 1px;
          animation: eq 1s ease-in-out infinite;
        }
        .playlist-playing span:nth-child(2) { animation-delay: 0.2s; }
        .playlist-playing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes eq {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
      </style>
      <div class="playlist-header">
        <span>播放列表</span>
        <span class="playlist-count">${this._tracks.length} 首</span>
      </div>
      <div class="playlist-body" data-part="list-body"></div>
    `
    document.body.appendChild(panel)

    // 关闭面板外点击
    const listBtn = this.$('[data-act="list"]')
    document.addEventListener('click', (e: Event) => {
      if (!panel.classList.contains('open')) return
      if (panel.contains(e.target as Node) || (listBtn && listBtn.contains(e.target as Node))) return
      panel.classList.remove('open')
    })

    this._listPanel = panel
    return panel
  }

  private _renderList (): void {
    if (!this._listPanel) return
    const body = this._listPanel.querySelector('[data-part="list-body"]') as HTMLElement
    body.innerHTML = this._tracks.map((track, index) => `
      <div class="playlist-item ${index === this._index ? 'active' : ''}" data-index="${index}">
        <span class="playlist-index">${index + 1}</span>
        <div class="playlist-info">
          <p class="playlist-title">${escapeHtml(track.title)}</p>
          <p class="playlist-artist">${escapeHtml(track.artist)}</p>
        </div>
        <span class="playlist-duration">${track.duration && isFinite(track.duration) ? formatTime(track.duration) : '--:--'}</span>
        <span class="playlist-playing" aria-hidden="true"><span></span><span></span><span></span></span>
      </div>
    `).join('')

    body.querySelectorAll('.playlist-item').forEach(el => {
      el.addEventListener('click', () => {
        const i = parseInt((el as HTMLElement).dataset.index || '0', 10)
        this._loadTrack(i, true)
      })
    })
  }

  private _toggleList (): void {
    const panel = this._ensureListPanel()
    this._renderList()
    const listBtn = this.$('[data-act="list"]') as HTMLElement | null
    if (listBtn) {
      const r = listBtn.getBoundingClientRect()
      const pw = panel.offsetWidth || 320
      panel.style.left = Math.max(8, Math.min(window.innerWidth - pw - 8, r.left + r.width / 2 - pw / 2)) + 'px'
      panel.style.bottom = '56px'
    }
    panel.classList.toggle('open')
  }

  // ===== 键盘快捷键 =====
  private _bindKeyboard (): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      const tag = (e.target && (e.target as HTMLElement).tagName) || ''
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space') { e.preventDefault(); this._toggle() }
      else if (e.code === 'ArrowLeft') { this._prev() }
      else if (e.code === 'ArrowRight') { this._next() }
    })
  }

  // ===== 播放控制方法 =====
  private _play (): void {
    if (this._audio) {
      const p = this._audio.play()
      if (p && p.catch) p.catch(() => {})
    }
  }

  private _pause (): void {
    if (this._audio) this._audio.pause()
  }

  private _toggle (): void {
    if (this._audio) this._audio.paused ? this._play() : this._pause()
  }

  private _nextIndex (): number {
    if (this._mode === 'shuffle') {
      if (this._tracks.length <= 1) return 0
      let i: number
      do { i = Math.floor(Math.random() * this._tracks.length) } while (i === this._index)
      return i
    }
    return (this._index + 1) % this._tracks.length
  }

  private _prevIndex (): number {
    if (this._mode === 'shuffle') return this._nextIndex()
    return (this._index - 1 + this._tracks.length) % this._tracks.length
  }

  private _loadTrack (i: number, autoplay?: boolean): void {
    this._index = (i + this._tracks.length) % this._tracks.length
    this._current = 0
    if (this._audio) {
      this._audio.src = this._tracks[this._index].src
    }
    this._updateInfo()
    if (autoplay) this._play()
    this._renderList()
    this.emit('track-change', { index: this._index, track: this._tracks[this._index] })
  }

  private _next (): void {
    this._loadTrack(this._nextIndex(), true)
  }

  private _prev (): void {
    if (this._current > 3) {
      this._current = 0
      if (this._audio) this._audio.currentTime = 0
      this._updateProgress()
      return
    }
    this._loadTrack(this._prevIndex(), true)
  }

  private _cycleMode (): void {
    const i = PLAY_MODES.indexOf(this._mode)
    this._mode = PLAY_MODES[(i + 1) % PLAY_MODES.length]
    store.set('player:mode', this._mode)
    this._renderMode()
  }

  private _renderMode (): void {
    const btn = this.$('[data-part="mode-btn"]') as HTMLElement | null
    if (!btn) return
    const m = this._mode
    const label = m === 'loop' ? '列表循环' : m === 'single' ? '单曲循环' : '随机播放'
    btn.dataset.mode = m
    btn.title = label
    btn.setAttribute('aria-label', label)
    btn.classList.add('is-mode-active')

    const svg = btn.querySelector('svg') as SVGElement | null
    if (!svg) return
    svg.innerHTML = ''
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('width', '17')
    svg.setAttribute('height', '17')

    const add = (d: string) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      p.setAttribute('d', d)
      svg.appendChild(p)
    }
    if (m === 'shuffle') {
      ;['M16 3h5v5', 'M4 20L21 3', 'M21 16v5h-5', 'M15 15l6 6', 'M4 4l5 5'].forEach(add)
    } else if (m === 'single') {
      ;['m17 2 4 4-4 4', 'M3 11v-1a4 4 0 0 1 4-4h14', 'm7 22-4-4 4-4', 'M21 13v1a4 4 0 0 1-4 4H3', 'M11 10h1v4'].forEach(add)
    } else {
      ;['m17 2 4 4-4 4', 'M3 11v-1a4 4 0 0 1 4-4h14', 'm7 22-4-4 4-4', 'M21 13v1a4 4 0 0 1-4 4H3'].forEach(add)
    }
  }

  private _syncPlayIcon (): void {
    const btn = this.$('[data-act="play"]')
    if (btn) {
      btn.classList.toggle('is-playing', this._isPlaying)
    }
  }

  private _updateInfo (): void {
    const t = this._tracks[this._index]
    const title = this.$('[data-part="title"]')
    const artist = this.$('[data-part="artist"]')
    const duration = this.$('[data-part="duration"]')
    if (title) title.textContent = t.title
    if (artist) artist.textContent = t.artist
    if (duration) duration.textContent = (t.duration && isFinite(t.duration)) ? formatTime(t.duration) : '00:00'
    this._updateProgress()
  }

  private _updateProgress (): void {
    const t = this._tracks[this._index]
    const pct = t.duration && t.duration > 0 ? Math.min(100, (this._current / t.duration) * 100) : 0
    const fill = this.$('[data-part="fill"]') as HTMLElement | null
    const thumb = this.$('[data-part="thumb"]') as HTMLElement | null
    const current = this.$('[data-part="current"]')
    if (fill) fill.style.width = pct + '%'
    if (thumb) thumb.style.left = pct + '%'
    if (current) current.textContent = formatTime(this._current)
  }

  private _prefillDurations (): void {
    this._tracks.forEach((t, i) => {
      const probe = new Audio(t.src)
      probe.preload = 'metadata'
      probe.addEventListener('durationchange', () => {
        if (probe.duration && isFinite(probe.duration)) {
          t.duration = probe.duration
          if (i === this._index) this._updateInfo()
          if (this._listPanel) this._renderList()
        }
      })
    })
  }
}

if (!customElements.get('music-player')) {
  customElements.define('music-player', MusicPlayer)
}

export { MusicPlayer }