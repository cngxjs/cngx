import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAudioStatus: async lifecycle earcons',
  subtitle:
    'The audition counterpart of <code>CngxToastOn</code>. Bind <code>[cngxAudioStatus]</code> next to a <code>CngxAsyncState</code> producer and the <code>status:earcon</code> grammar plays one earcon per lifecycle transition - <code>pending</code> on start, <code>succeeded</code> on resolve, <code>failed</code> on reject. It fires only on real transitions, never on the initial <code>idle</code>.',
  description:
    'Upload composes CngxAsyncClick with CngxAudioStatus. The explicit [state]="upload.state" feeds the bridge; each transition plays tap -> success (or error). Toggle "fail next" to hear the error earcon. Click once to arm audio first (browser autoplay policy).',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'async-state', 'integration'],
  apiComponents: ['CngxAudioStatus'],
  moduleImports: [
    "import { CngxAudioStatus, injectCngxAudio } from '@cngx/common/audio';",
    "import { CngxAsyncClick } from '@cngx/common/interactive';",
  ],
  imports: ['CngxAsyncClick', 'CngxAudioStatus'],
  setup: `
  protected readonly upload = () =>
    new Promise<void>((resolve, reject) =>
      setTimeout(() => (this.failNext ? reject(new Error('Upload failed')) : resolve()), 900),
    );`,
  setupChrome: `protected readonly audio = injectCngxAudio();
  protected failNext = false;

  constructor() {
    // Demo-only hook so the headless e2e can read lastPlayed() without sniffing audio.
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>)['__cngxAudioEngine'] = this.audio;
    }
  }`,
  template: `
  <button
    type="button"
    class="demo-button"
    [cngxAsyncClick]="upload"
    #upload="cngxAsyncClick"
    [state]="upload.state"
    [cngxAudioStatus]="'pending:tap, succeeded:success, failed:error'">
    @switch (upload.status()) {
      @case ('pending') { Uploading... }
      @case ('success') { Uploaded }
      @case ('error') { Failed }
      @default { Upload }
    }
  </button>`,
  templateChrome: `
  <div class="status-row" style="margin-top:0.75rem; gap:0.75rem; align-items:center;">
    <label style="display:flex; gap:0.4rem; align-items:center;">
      <input type="checkbox" [checked]="failNext" (change)="failNext = $any($event.target).checked" />
      <span>Fail next upload</span>
    </label>
    <span class="status-badge">last played: {{ audio.lastPlayed() ?? 'none' }}</span>
  </div>`,
};
