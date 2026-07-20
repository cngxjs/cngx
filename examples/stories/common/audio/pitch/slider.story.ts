import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAudioPitch: value sonification',
  subtitle:
    'Sonify a continuous number. <code>[cngxAudioPitch]</code> clamps the value against a fixed <code>[pitchDomain]</code>, linear-scales it into <code>[pitchRange]</code> Hz, and plays a short tone on each change. The inputs are discrete so <code>[cngxAudioPitch]="level"</code> stays a native reactive binding. Rapid sweeps are throttled to one tone per <code>[pitchThrottleMs]</code>.',
  description:
    'Drag the slider (or arrow-key it) and the pitch rises with the value: 0 maps to 220 Hz, 100 to 880 Hz. Moving the slider arms audio automatically (it is a real gesture).',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxAudioPitch'],
  moduleImports: ["import { CngxAudioPitch, injectCngxAudio } from '@cngx/common/audio';"],
  imports: ['CngxAudioPitch'],
  setup: `
  protected level = 50;

  protected onInput(event: Event): void {
    this.level = Number((event.target as HTMLInputElement).value);
  }`,
  setupChrome: `protected readonly audio = injectCngxAudio();

  constructor() {
    // Demo-only hook so the headless e2e can read lastPlayed() without sniffing audio.
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>)['__cngxAudioEngine'] = this.audio;
    }
  }`,
  template: `
  <div style="display:flex; gap:0.75rem; align-items:center;">
    <label for="pitch-level">Level</label>
    <input
      id="pitch-level"
      type="range"
      min="0"
      max="100"
      step="1"
      [value]="level"
      (input)="onInput($event)"
      [cngxAudioPitch]="level"
      [pitchDomain]="[0, 100]"
      [pitchRange]="[220, 880]"
      [pitchThrottleMs]="60" />
    <span class="status-badge">{{ level }}</span>
  </div>`,
};
