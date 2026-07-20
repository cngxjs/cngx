import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAudio: Hover and focus',
  subtitle:
    'The <code>event:earcon</code> grammar covers more than click. Bind <code>pointerenter</code>, <code>pointerleave</code>, <code>focus</code>, and <code>blur</code> to give navigation a quiet audible texture - one earcon per interaction, comma-separated.',
  description:
    'Hover the links to hear a soft tap; focus one with the keyboard to hear a notification. A single button click first arms audio (browser autoplay policy), then hover and focus play freely.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  references: [
    {
      label: 'WCAG 2.2 SC 1.3.3 Sensory Characteristics',
      href: 'https://www.w3.org/WAI/WCAG22/Understanding/sensory-characteristics.html',
    },
  ],
  apiComponents: ['CngxAudio'],
  moduleImports: ["import { CngxAudio } from '@cngx/common/audio';"],
  imports: ['CngxAudio'],
  template: `
  <nav aria-label="Demo navigation" style="display:flex; gap:0.5rem; flex-wrap:wrap;">
    @for (item of ['Dashboard', 'Inbox', 'Reports', 'Settings']; track item) {
      <a
        href="#"
        class="demo-button"
        [cngxAudio]="'pointerenter:tap, focus:notification'"
        (click)="$event.preventDefault()">
        {{ item }}
      </a>
    }
  </nav>`,
  templateChromeBefore: `<p class="demo-hint" style="margin-bottom:0.75rem;">
    Click once anywhere to arm audio, then hover or Tab through the links. Hover plays tap, focus plays notification.
  </p>`,
};
