import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAudio: form event feedback',
  subtitle:
    'Bind form events - <code>input</code>, <code>change</code>, <code>submit</code> - to earcons directly on the fields and the form element. The engine debounces same-name plays, so typing does not machine-gun the tap sound.',
  description:
    'Type in the name field (input plays a debounced tap), toggle the checkbox (change plays success), and submit the form (submit plays complete). The first interaction arms audio.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'integration'],
  apiComponents: ['CngxAudio'],
  moduleImports: ["import { CngxAudio } from '@cngx/common/audio';"],
  imports: ['CngxAudio'],
  template: `
  <form
    [cngxAudio]="'submit:complete'"
    (submit)="$event.preventDefault()"
    style="display:grid; gap:0.75rem; max-width:320px;">
    <label style="display:grid; gap:0.25rem;">
      <span>Name</span>
      <input type="text" [cngxAudio]="'input:tap'" placeholder="Type here" />
    </label>
    <label style="display:flex; gap:0.5rem; align-items:center;">
      <input type="checkbox" [cngxAudio]="'change:success'" />
      <span>Subscribe to updates</span>
    </label>
    <button type="submit" class="demo-button">Submit</button>
  </form>`,
  templateChromeBefore: `<p class="demo-hint" style="margin-bottom:0.75rem;">
    Typing plays a debounced tap; toggling the checkbox plays success; submitting plays complete.
  </p>`,
};
