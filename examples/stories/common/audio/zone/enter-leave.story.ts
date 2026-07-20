import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAudioZone: enter, leave, focus, blur',
  subtitle:
    'A spatial complement to <code>[cngxAudio]</code>. Pass a record of earcons and <code>[cngxAudioZone]</code> plays them as the pointer or keyboard focus enters and leaves the host - <code>enter</code>/<code>leave</code> on hover, <code>focus</code>/<code>blur</code> on focus. Any omitted key stays silent.',
  description:
    'Hover the panel to hear a notification on entry and a tap on exit. Tab into it to hear the focus earcon and Tab out to hear the blur earcon - moving between the two buttons inside the zone stays silent, because only a crossing of the zone boundary counts. Click "Enable sound" once to arm audio (browser autoplay policy).',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxAudioZone'],
  moduleImports: ["import { CngxAudioZone, injectCngxAudio } from '@cngx/common/audio';"],
  imports: ['CngxAudioZone'],
  setupChrome: `protected readonly audio = injectCngxAudio();

  constructor() {
    // Demo-only hook so the headless e2e can read lastPlayed() without sniffing audio.
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>)['__cngxAudioEngine'] = this.audio;
    }
  }`,
  template: `
  <div
    role="group"
    aria-label="Playback controls"
    [cngxAudioZone]="{ enter: 'notification', leave: 'tap', focus: 'notification', blur: 'tap' }"
    style="display:flex; gap:0.75rem; align-items:center; justify-content:center; min-height:8rem; padding:1.5rem; border:1px dashed var(--cngx-color-border, #cbd5e1); border-radius:0.5rem;">
    <button type="button" class="demo-button">Rewind</button>
    <button type="button" class="demo-button">Forward</button>
  </div>`,
  templateChromeBefore: `
  <div class="button-row" style="margin-bottom:0.75rem; gap:0.75rem; align-items:center;">
    <button type="button" class="demo-button" (click)="audio.armAutoplay()">Enable sound</button>
    <span class="demo-hint">Then hover the panel or Tab to it.</span>
  </div>`,
  templateChrome: `
  <div class="status-row" style="margin-top:0.75rem;">
    <span class="status-badge">last played: {{ audio.lastPlayed() ?? 'none' }}</span>
  </div>`,
};
