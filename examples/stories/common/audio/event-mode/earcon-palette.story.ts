import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAudio: the six built-in earcons',
  subtitle:
    'Every built-in earcon is synthesised from <code>OscillatorNode</code> - zero audio assets. Click each button to hear <code>tap</code>, <code>success</code>, <code>error</code>, <code>warning</code>, <code>notification</code>, and <code>complete</code>.',
  description:
    'A palette of the six names you can bind out of the box. The first click arms audio; turn your volume up. Register your own with withEarcons({...}) or engine.register(...).',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['behavior', 'visual-variants'],
  apiComponents: ['CngxAudio'],
  moduleImports: ["import { CngxAudio } from '@cngx/common/audio';"],
  imports: ['CngxAudio'],
  template: `
  <div style="display:flex; flex-wrap:wrap; gap:0.75rem;">
    <button type="button" class="demo-button" [cngxAudio]="'click:tap'">tap</button>
    <button type="button" class="demo-button" [cngxAudio]="'click:success'">success</button>
    <button type="button" class="demo-button" [cngxAudio]="'click:error'">error</button>
    <button type="button" class="demo-button" [cngxAudio]="'click:warning'">warning</button>
    <button type="button" class="demo-button" [cngxAudio]="'click:notification'">notification</button>
    <button type="button" class="demo-button" [cngxAudio]="'click:complete'">complete</button>
  </div>`,
  templateChromeBefore: `<p class="demo-hint" style="margin-bottom:0.75rem;">
    Each button binds one built-in earcon by name. Same directive, different sound.
  </p>`,
};
