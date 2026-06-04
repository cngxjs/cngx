import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFocusTrap: Modal dialog',
  subtitle:
    '<code>[cngxFocusTrap]</code> wraps the CDK <code>FocusTrap</code>. When <code>[enabled]="true"</code>, Tab and Shift+Tab cycle only within the host. <code>[autoFocus]="true"</code> (default) moves focus to the first tabbable element on open.',
  description:
    'Confines Tab cycling to the dialog while it is open: <code>cngxFocusTrap</code> with <code>[enabled]</code> gates the cycle, <code>[autoFocus]</code> lands focus on the first tabbable control on mount, an Escape handler or backdrop click closes the panel. Paired with <code>cngxFocusRestore</code> on the same host so closing returns focus to the trigger instead of dropping it on <code>body</code>: trap and restore are the two atoms a real modal needs. The browser\'s <code>:focus-visible</code> ring only paints reliably after keyboard interaction, so the <code>Focused id</code> readout below makes the restore visible for mouse-driven runs too.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior', 'composition'],
  apiComponents: ['CngxFocusTrap', 'CngxFocusRestore'],
  imports: ['CngxFocusTrap', 'CngxFocusRestore'],
  references: [
    {
      label: 'WAI-ARIA APG: Dialog (Modal) pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    },
    {
      label: 'WCAG 2.1 SC 2.1.2 No Keyboard Trap (modal exception)',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap.html',
    },
  ],
  setup: `protected readonly modalOpen = signal(false);
  protected readonly autoFocus = signal(true);`,
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
          id="cngx-focus-trap-modal-trigger"
          class="chip"
          (click)="modalOpen.set(true)">Open modal</button>

  @if (modalOpen()) {
    <div class="cngx-ex-overlay-backdrop" (click)="modalOpen.set(false)">
      <div class="cngx-ex-overlay-panel"
           cngxFocusTrap
           [enabled]="modalOpen()"
           [autoFocus]="autoFocus()"
           cngxFocusRestore
           (keydown.escape)="modalOpen.set(false)"
           (click)="$event.stopPropagation()"
           tabindex="-1"
           role="dialog"
           aria-modal="true"
           aria-labelledby="cngx-focus-trap-modal-title"
           aria-describedby="cngx-focus-trap-modal-desc">
        <h3 id="cngx-focus-trap-modal-title" style="margin:0">Confirm action</h3>
        <p id="cngx-focus-trap-modal-desc" style="margin:0;font-size:0.875rem">
          Tab cycles only within this dialog. Press Escape or click outside to close.
        </p>
        <label for="cngx-focus-trap-modal-input">Type CONFIRM to proceed</label>
        <input id="cngx-focus-trap-modal-input" />
        <div style="display:flex;justify-content:flex-end;gap:8px">
          <button type="button" class="chip" (click)="modalOpen.set(false)">Cancel</button>
          <button type="button" class="chip" (click)="modalOpen.set(false)">Confirm</button>
        </div>
      </div>
    </div>
  }`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label style="display:flex;align-items:center;gap:6px;font-size:0.875rem">
      <input type="checkbox"
             [checked]="autoFocus()"
             (change)="autoFocus.set($any($event.target).checked)" />
      autoFocus
    </label>
  </div>
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">Modal</span>
      <span class="event-value">{{ modalOpen() ? 'open, focus trapped' : 'closed' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Focused id</span>
      <span class="event-value">{{ focusedId() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">autoFocus</span>
      <span class="event-value">{{ autoFocus() }}</span>
    </div>
  </div>`,
};
