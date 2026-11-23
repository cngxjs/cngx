import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRipple: under reduced motion',
  subtitle: 'The ripple follows the app motion axis. Inside a <code>[cngxMotionScope]="\'reduced\'"</code> subtree (or under <code>provideMotion</code> / the OS preference) the wave does not expand: it appears at full size and only fades.',
  description: 'Reduced motion is the stylesheet\'s call, not the directive\'s: <code>cngxRipple</code> always creates the wave, and <code>cngx-ripple.css</code> swaps the expansion for the <code>cngx-ripple-fade</code> keyframes under a <code>[data-motion=\'reduced\']</code> ancestor. With the reduced-motion safety net of <code>@cngx/themes/cngx.css</code> loaded, as in this app, that fade collapses to 0.01ms, so the right-hand button shows no wave at all; without the net the wave fades in place. Toggle the scope to compare.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'visual-variants'],
  references: [
    {
      label: 'WCAG 2.1 SC 2.3.3 Animation from Interactions',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html',
    },
  ],
  apiComponents: [
    'CngxRipple',
    'CngxMotionScope',
  ],
  moduleImports: [
    'import { CngxRipple } from \'@cngx/common/interactive\';',
    'import { CngxMotionScope } from \'@cngx/core\';',
  ],
  imports: ['CngxRipple', 'CngxMotionScope'],
  setup: `protected readonly reduce = signal(true);`,
  template: `  <div style="display:flex;flex-wrap:wrap;gap:8px">
    <button type="button" class="chip" cngxRipple>Full motion</button>
    <div [cngxMotionScope]="reduce() ? 'reduced' : undefined" style="display:contents">
      <button type="button" class="chip" cngxRipple>Scoped motion</button>
    </div>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" [attr.aria-pressed]="reduce()" (click)="reduce.set(!reduce())">Reduce motion on the right</button>
  </div>`,
};
