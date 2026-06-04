import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFocusRestore: Panel with automatic restore',
  subtitle: 'Click "Open panel": focus moves into the panel. Close it and focus returns to the trigger.',
  description: 'Dialog-style open/close: the panel owns its own dismiss control, and the directive snapshots the trigger when the panel mounts so focus lands back on it after the panel unmounts. Restoration is input-agnostic, but the browser\'s <code>:focus-visible</code> ring (the only built-in signal of <em>where</em> focus landed) only paints reliably after keyboard interaction. The <code>Focused id</code> readout below confirms the restore either way.',
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
    {
      label: 'WAI-ARIA APG: Dialog focus management',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/#keyboardinteraction',
    },
  ],
  setup: `protected readonly panelOpen = signal(false);`,
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
          id="cngx-focus-restore-panel-open"
          class="chip"
          (click)="panelOpen.set(true)">Open panel</button>

  @if (panelOpen()) {
    <div cngxFocusRestore
         style="margin-top:12px;display:flex;flex-direction:column;gap:12px;max-width:360px">
      <p style="margin:0">Panel content. Focus will restore on close.</p>
      <button type="button"
              id="cngx-focus-restore-panel-close"
              class="chip"
              (click)="panelOpen.set(false)">Close panel</button>
    </div>
  }`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Focused id</span>
      <span class="event-value">{{ focusedId() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Panel open</span>
      <span class="event-value">{{ panelOpen() }}</span>
    </div>
  </div>`,
};
