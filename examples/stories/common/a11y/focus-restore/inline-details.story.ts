import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFocusRestore: Inline details',
  subtitle: 'A collapsible detail section. When collapsed, focus returns to the toggle button.',
  description: 'Restores focus to the previously focused element when a collapsible block unmounts. Restoration is input-agnostic and works for mouse or keyboard, but the browser\'s <code>:focus-visible</code> ring is the only built-in signal of <em>where</em> focus landed and only paints reliably after keyboard interaction. The <code>Focused id</code> readout below confirms the restore either way.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxFocusRestore'],
  moduleImports: ["import { CngxFocusRestore } from '@cngx/common/a11y';"],
  imports: ['CngxFocusRestore'],
  references: [
    {
      label: 'WCAG 2.1 SC 2.4.3 Focus Order',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html',
    },
  ],
  setup: `protected readonly detailsOpen = signal(false);`,
  setupChrome: `protected readonly focusedId = signal<string>('—');

  constructor() {
    const host = inject(ElementRef).nativeElement as HTMLElement;
    afterNextRender(() => {
      host.addEventListener('focusin', (e) => {
        const t = e.target as HTMLElement | null;
        this.focusedId.set(t?.id || (t?.tagName.toLowerCase() ?? '—'));
      });
      host.addEventListener('focusout', () => {
        setTimeout(() => {
          if (!host.contains(document.activeElement)) {
            this.focusedId.set('—');
          }
        }, 0);
      });
    });
  }`,
  template: `  <button type="button"
          id="cngx-focus-restore-inline-trigger"
          class="chip"
          [attr.aria-expanded]="detailsOpen()"
          (click)="detailsOpen.set(!detailsOpen())">
    {{ detailsOpen() ? 'Hide details' : 'Show details' }}
  </button>

  @if (detailsOpen()) {
    <div cngxFocusRestore
         style="margin-top:8px;display:flex;flex-direction:column;gap:8px;max-width:320px">
      <p style="margin:0">Extra details that appear dynamically. Tab through these fields, then close.</p>
      <label for="cngx-focus-restore-inline-name">Name</label>
      <input id="cngx-focus-restore-inline-name" />
      <label for="cngx-focus-restore-inline-email">Email</label>
      <input id="cngx-focus-restore-inline-email" type="email" />
    </div>
  }`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Focused id</span>
      <span class="event-value">{{ focusedId() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Details open</span>
      <span class="event-value">{{ detailsOpen() }}</span>
    </div>
  </div>`,
};
