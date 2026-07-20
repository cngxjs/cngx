import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAudio: event-mode earcons',
  subtitle:
    'The <code>[cngxAudio]</code> directive maps a DOM event to an earcon with the <code>event:earcon</code> grammar. No state, no config - drop it on any element and the built-in oscillator earcons play on interaction.',
  description:
    'The first click both arms audio (browser autoplay policy) and fires its earcon. Turn your volume up. Each button binds a different built-in earcon via a plain string.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxAudio'],
  moduleImports: ["import { CngxAudio } from '@cngx/common/audio';"],
  imports: ['CngxAudio'],
  template: `
  <div style="display:flex; flex-wrap:wrap; gap:0.75rem;">
    <button type="button" class="demo-button" [cngxAudio]="'click:tap'">Tap</button>
    <button type="button" class="demo-button" [cngxAudio]="'click:success'">Success</button>
    <button type="button" class="demo-button" [cngxAudio]="'click:error'">Error</button>
    <button type="button" class="demo-button" [cngxAudio]="'click:complete'">Complete</button>
  </div>`,
  templateChromeBefore: `<p class="demo-hint" style="margin-bottom:0.75rem;">
    Click a button. The first click arms audio; every click then plays its mapped earcon.
  </p>`,
};
