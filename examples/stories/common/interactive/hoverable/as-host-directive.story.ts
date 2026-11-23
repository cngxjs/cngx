import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxHoverable: As host directive',
  subtitle: 'Compose <code>CngxHoverable</code> into your own component via <code>hostDirectives</code> and read the state with <code>inject(CngxHoverable, { host: true })</code>.',
  description: 'Three independent <code>demo-hover-card</code> instances. Each card declares <code>hostDirectives: [CngxHoverable]</code> on its own decorator, injects the directive via <code>inject(CngxHoverable, { host: true })</code>, and binds its own <code>:host</code> class on the hover signal. The cards do not share state and they do not need their own pointer handlers; the composition primitive lives on each host. The cards are display-only, so hover is decoration here and needs no keyboard equivalent; an interactive card would pair it with focus as the basic demo does. The fixture component sits next to this story as <code>_hover-card.component.ts</code> so the composition code reads at a glance.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition'],
  apiComponents: [
    'CngxHoverable',
  ],
  moduleImports: [
    'import { HoverCard } from \'./_hover-card.component\';',
  ],
  imports: ['HoverCard'],
  template: `
  <div style="display:flex; gap:12px; flex-wrap:wrap">
    <demo-hover-card>First card</demo-hover-card>
    <demo-hover-card>Second card</demo-hover-card>
    <demo-hover-card>Third card</demo-hover-card>
  </div>`,
};
