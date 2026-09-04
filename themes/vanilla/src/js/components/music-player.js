import { defineTemplateComponent } from './define-component.js'

function escapeHtml (value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]))
}

/** 音量弹层骨架，数值和滑块位置由播放器状态同步。 */
export function volumePanelTemplate () {
  return `
    <div class="volume-panel-inner">
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
        <path d="M2.5 7v6h3.2l4.3 3.6V3.4L5.7 7H2.5z" fill="currentColor"/>
        <path d="M12.5 6.5a4.5 4.5 0 010 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/>
      </svg>
      <div class="volume-slider">
        <div class="volume-slider-track">
          <div class="volume-slider-fill"></div>
          <div class="volume-slider-thumb"></div>
        </div>
      </div>
      <span class="volume-pct">50%</span>
    </div>
  `
}

/** 播放列表弹层骨架；trackCount 是当前真实曲目数量。 */
export function playlistPanelTemplate (trackCount) {
  return `
    <div class="playlist-header">
      <span>播放列表</span>
      <span class="playlist-count">${Number(trackCount)} 首</span>
    </div>
    <div class="playlist-body"></div>
  `
}

/** 根据播放状态重绘曲目行，并标记当前正在播放的项目。 */
export function playlistItemsTemplate (tracks, activeIndex, formatDuration) {
  return tracks.map((track, index) => `
    <div class="playlist-item ${index === activeIndex ? 'active' : ''}" data-index="${index}">
      <span class="playlist-index">${index + 1}</span>
      <div class="playlist-info">
        <p class="playlist-title">${escapeHtml(track.title)}</p>
        <p class="playlist-artist">${escapeHtml(track.artist)}</p>
      </div>
      <span class="playlist-duration">${track.duration && isFinite(track.duration) ? formatDuration(track.duration) : '--:--'}</span>
      <span class="playlist-playing" aria-hidden="true"><span></span><span></span><span></span></span>
    </div>
  `).join('')
}

// 底部播放器主体；音频引擎和交互监听仍由 initPlayer 统一管理。
defineTemplateComponent('music-player', host => {
  host.className = 'music-player relative z-30 flex h-[50px] min-h-[50px] shrink-0 items-center border-t border-white/15 bg-[rgba(0,0,0,0.42)] px-8 backdrop-blur-[16px] backdrop-saturate-[1.2]'

  return `
    <div class="player-controls flex shrink-0 items-center gap-[6px]">
      <button class="player-btn is-control relative flex h-8 w-8 items-center justify-center rounded-full p-1.5 text-sub transition-[background,color,transform] duration-200 hover:bg-white/[0.06] hover:text-white active:scale-[0.94] active:text-(--brand-primary)" data-act="prev" aria-label="上一首" title="上一首">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" class="text-inherit">
          <path d="M11 5L4 11l7 6V5z" fill="currentColor"/>
          <rect x="3.5" y="5" width="2" height="12" rx="0.6" fill="currentColor"/>
          <rect x="16.5" y="5" width="2" height="12" rx="0.6" fill="currentColor"/>
        </svg>
      </button>

      <button id="play-btn" class="player-btn is-primary relative mx-1 flex size-8 items-center justify-center rounded-full bg-(--brand-primary) text-white shadow-[0_3px_10px_rgba(var(--brand-rgb),0.32)] transition-[background,color,transform,box-shadow] duration-200 ease-out hover:scale-[1.08] hover:bg-[#FF5A41] hover:shadow-[0_5px_14px_rgba(var(--brand-rgb),0.45)] active:scale-[0.95] active:bg-[#D9452E]" data-act="play" aria-label="播放" title="播放/暂停">
        <svg class="icon-play" width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 3.5L16.5 10 5 16.5V3.5z" fill="currentColor"/></svg>
        <svg class="icon-pause" width="16" height="16" viewBox="0 0 20 20" fill="none">
          <rect x="5" y="3.5" width="3" height="13" rx="0.8" fill="currentColor"/>
          <rect x="12" y="3.5" width="3" height="13" rx="0.8" fill="currentColor"/>
        </svg>
      </button>

      <button class="player-btn is-control relative flex h-8 w-8 items-center justify-center rounded-full p-1.5 text-sub transition-[background,color,transform] duration-200 hover:bg-white/[0.06] hover:text-white active:scale-[0.94] active:text-(--brand-primary)" data-act="next" aria-label="下一首" title="下一首">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" class="text-inherit">
          <path d="M11 5l7 6-7 6V5z" fill="currentColor"/>
          <rect x="3.5" y="5" width="2" height="12" rx="0.6" fill="currentColor"/>
          <rect x="16.5" y="5" width="2" height="12" rx="0.6" fill="currentColor"/>
        </svg>
      </button>
    </div>

    <div class="mx-8 min-w-0 flex-1">
      <p class="mb-1.5 truncate leading-none">
        <span class="track-title text-xs font-medium leading-none tracking-[0.01em] text-body">SoundHelix Song 1</span><span class="mx-1.5 text-[#5D5A59]">·</span><span class="track-artist text-xs leading-none tracking-[0.01em] text-mute">SoundHelix</span>
      </p>
      <div class="flex items-center gap-3">
        <span class="time-current min-w-8 text-[11px] leading-none text-dim tabular-nums">00:00</span>
        <div class="progress-track group relative h-1 min-w-0 flex-1 cursor-pointer rounded transition-all duration-150 hover:h-1.5">
          <div class="progress-fill absolute inset-y-0 left-0 h-full w-0 rounded bg-[linear-gradient(90deg,#6B6B6B,#9E9D99)]" style="transition:width 0.05s linear"></div>
          <div class="progress-thumb absolute left-0 top-1/2 size-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-[0_0_0_3px_rgba(255,255,255,0.1)] transition-[opacity,transform,left] duration-200 ease-out group-hover:opacity-100"></div>
        </div>
        <span class="time-duration min-w-8 text-right text-[11px] leading-none text-dim tabular-nums">00:00</span>
      </div>
    </div>

    <button class="player-btn volume-btn relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full p-1.5 text-sub transition-[background,color,transform] duration-200 hover:bg-white/[0.06] hover:text-white active:scale-[0.94] active:text-(--brand-primary)" data-act="volume" aria-label="音量" title="音量">
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

    <button class="player-btn mode-toggle relative mx-2 flex h-8 w-[34px] shrink-0 items-center justify-center rounded-full text-sub transition-[background,color,transform] duration-200 hover:bg-white/[0.06] hover:text-white active:scale-[0.94]" data-mode="loop" aria-label="列表循环">
      <svg class="mode-glyph" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>
      </svg>
    </button>

    <button class="player-btn is-pill flex shrink-0 cursor-pointer items-center gap-[5px] rounded-xl bg-soft px-2.5 py-1 text-mute transition-[background,color,transform] duration-200 hover:bg-[#2a2a2a] hover:text-white active:scale-[0.97]" aria-label="播放列表">
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <rect x="2" y="3" width="13" height="2" rx="1" fill="#6B6B6B"/><rect x="2" y="7" width="13" height="2" rx="1" fill="#6B6B6B"/><rect x="2" y="11" width="8" height="2" rx="1" fill="#6B6B6B"/>
      </svg>
      <span class="text-xs tabular-nums text-inherit">0</span>
    </button>
  `
})
