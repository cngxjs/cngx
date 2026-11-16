import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidebar: Collapsible rail',
  subtitle:
    '<code>[cngxSidebar]</code> on its own: a box that rests as a rail or hidden, peeks over the content without reflow and sits on either side. <code>class="cngx-sidebar"</code> adds the base skin.',
  description:
    'The sidebar is a flex item whose inline size follows its state. Collapsed as rail it keeps <code>--cngx-sidebar-rail-size</code> and clips what does not fit; it does not rearrange its content. Resting the pointer on the rail peeks the sidebar at full size over the content: the content column keeps its position because the reserved space stays at the rail size, and the base skin adds a shadow. Escape, moving focus out or leaving with the pointer ends the peek. Collapsed as hidden, the sidebar reserves no space and is inert and aria-hidden until expanded. <code>side</code> names the edge the sidebar sits on; the base skin draws its border toward the content. The page shell is yours: here a <code>cngx-stack</code> row, with <code>order</code> putting an end sidebar after the column. The <code>[cngxPanelToggle]</code> in the content column toggles collapsed and carries aria-expanded and aria-controls.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxSidebar', 'CngxPanelToggle'],
  moduleImports: [
    "import { CngxPanelToggle, CngxSidebar } from '@cngx/common/layout';",
    "import { CngxStack } from '@cngx/ui/layout';",
  ],
  imports: ['CngxSidebar', 'CngxPanelToggle', 'CngxStack'],
  setup: `
  protected readonly collapsed = signal(true);
  protected readonly collapsedAs = signal<'rail' | 'hidden'>('rail');
  protected readonly side = signal<'start' | 'end'>('start');`,
  template: `
  <cngx-stack direction="row" gap="none">
    <aside cngxSidebar #sidebar="cngxSidebar" class="cngx-sidebar" label="Main"
           [(collapsed)]="collapsed" [collapsedAs]="collapsedAs()" [side]="side()" [expandDelay]="450"
           [style.order]="side() === 'end' ? 1 : 0">
      <p style="box-sizing: border-box; inline-size: var(--cngx-sidebar-size, 16rem); padding: var(--cngx-space-md, 1rem); margin: 0">Sidebar content at the expanded width. On the rail it is clipped, not rearranged.</p>
    </aside>
    <div style="flex: 1 1 auto; min-inline-size: 0; padding: var(--cngx-space-md, 1rem)">
      <button type="button" [cngxPanelToggle]="sidebar" label="Main sidebar"></button>
      <p>Content column. Its edge follows the reserved space, not the peek.</p>
    </div>
  </cngx-stack>`,
  setupChrome: `
  protected readonly rests: ('rail' | 'hidden')[] = ['rail', 'hidden'];
  protected readonly sides: ('start' | 'end')[] = ['start', 'end'];`,
  templateChrome: `
  <div class="filter-row" role="group" aria-label="Collapsed as" style="margin-top: 12px">
    @for (r of rests; track r) {
      <button type="button" class="chip" [attr.aria-pressed]="collapsedAs() === r"
              (click)="collapsedAs.set(r)">{{ r }}</button>
    }
  </div>
  <div class="filter-row" role="group" aria-label="Side" style="margin-top: 12px">
    @for (s of sides; track s) {
      <button type="button" class="chip" [attr.aria-pressed]="side() === s"
              (click)="side.set(s)">{{ s }}</button>
    }
  </div>
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">collapsed()</span>
      <span class="event-value">{{ collapsed() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">sidebar.state()</span>
      <span class="event-value">{{ sidebar.state() }}</span>
    </div>
  </div>`,
};
