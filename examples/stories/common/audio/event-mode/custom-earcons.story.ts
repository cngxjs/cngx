import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAudio: custom earcons + mute and volume',
  subtitle:
    'Register branded earcons on the shared engine with <code>injectCngxAudio().register(name, { sequence })</code>, then bind them by name. The mute toggle and volume slider drive the same handle - one engine, one <code>AudioContext</code> for the whole page. App-wide defaults use <code>provideCngxAudio(withEarcons({...}))</code> at bootstrap.',
  description:
    'Send and Receive play oscillator earcons registered at runtime. The third button binds an earcon but carries [audioDisabled], so it never plays. Mute and volume act on the shared handle.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'integration'],
  apiComponents: ['CngxAudio'],
  moduleImports: ["import { CngxAudio, injectCngxAudio } from '@cngx/common/audio';"],
  imports: ['CngxAudio'],
  setupChrome: `protected readonly audio = injectCngxAudio();

  constructor() {
    this.audio.register('send', { sequence: [{ freq: 880, duration: 60 }, { freq: 1180, duration: 90 }] });
    this.audio.register('receive', { sequence: [{ freq: 520, duration: 90 }] });
    // Demo-only hook so the headless e2e can read lastPlayed() without sniffing audio.
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>)['__cngxAudioEngine'] = this.audio;
    }
  }

  protected onVolume(event: Event): void {
    this.audio.setVolume(Number((event.target as HTMLInputElement).value));
  }`,
  template: `
  <div style="display:flex; flex-wrap:wrap; gap:0.75rem;">
    <button type="button" class="demo-button" [cngxAudio]="'click:send'">Send</button>
    <button type="button" class="demo-button" [cngxAudio]="'click:receive'">Receive</button>
    <button type="button" class="demo-button" [cngxAudio]="'click:send'" [audioDisabled]="true">
      Send (muted instance)
    </button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:0.75rem; gap:0.75rem; align-items:center;">
    <button type="button" class="demo-button" (click)="audio.setMuted(!audio.muted())">
      {{ audio.muted() ? 'Unmute' : 'Mute' }}
    </button>
    <label style="display:flex; gap:0.4rem; align-items:center;">
      <span>Volume</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        aria-label="Master volume"
        [value]="audio.volume()"
        (input)="onVolume($event)" />
    </label>
    <span class="status-badge">last played: {{ audio.lastPlayed() ?? 'none' }}</span>
  </div>`,
};
