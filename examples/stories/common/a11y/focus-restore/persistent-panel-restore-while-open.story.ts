import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFocusRestore: Persistent panel with cngxFocusRestoreWhile',
  subtitle:
    '<code>[cngxFocusRestoreWhile]="open()"</code> is for a surface that stays in the DOM while closed. The rising edge captures the focused element, the falling edge restores it when focus is still inside the panel or has dropped to <code>body</code>.',
  description:
    'The panel is never destroyed, it only toggles <code>[hidden]</code>, so the destroy path of <code>cngxFocusRestore</code> never runs. Binding the open state to <code>cngxFocusRestoreWhile</code> moves capture and restore to the state edges instead. Closing from inside the panel returns focus to the trigger; if you move focus to the "Elsewhere" button first and close from there, focus stays where you put it.',
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
  setup: `protected readonly open = signal(false);`,
  template: `  <div class="button-row">
    <button type="button"
            id="restore-while-trigger"
            class="chip"
            aria-controls="restore-while-panel"
            [attr.aria-expanded]="open()"
            (click)="open.set(true)">Open filters</button>
    <button type="button" id="restore-while-elsewhere" class="chip" (click)="open.set(false)">Elsewhere (closes too)</button>
  </div>

  <section id="restore-while-panel"
           cngxFocusRestore
           [cngxFocusRestoreWhile]="open()"
           [hidden]="!open()"
           aria-label="Filters"
           style="margin-top:8px">
    <div style="display:flex;flex-direction:column;gap:8px;max-width:320px">
      <label for="restore-while-query">Search term</label>
      <input id="restore-while-query" />
      <button type="button" class="chip" (click)="open.set(false)">Apply and close</button>
    </div>
  </section>`,
  setupChrome: `protected readonly focusedId = signal<string>('none');

  constructor() {
    const host = inject(ElementRef).nativeElement as HTMLElement;
    afterNextRender(() => {
      host.addEventListener('focusin', (e) => {
        const t = e.target as HTMLElement | null;
        this.focusedId.set(t?.id || (t?.tagName.toLowerCase() ?? 'none'));
      });
    });
  }`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Panel open</span>
      <span class="event-value">{{ open() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Focused id</span>
      <span class="event-value">{{ focusedId() }}</span>
    </div>
  </div>`,
};
