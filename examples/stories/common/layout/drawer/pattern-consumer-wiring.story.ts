import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: Pattern consumer wiring',
  subtitle:
    'The drawer is headless. The consumer wires <code>CngxAriaExpanded</code> on the trigger; the over panel is modal by default, so it traps focus and restores it to the trigger on close without further bindings.',
  description:
    'Live drawer wired through the consumer-owned a11y seams: CngxAriaExpanded with aria-controls on the <button type="button"> trigger, the panel id it points at, and a single drawer.opened() signal everything reads from. The modal over panel traps focus while open and hands it back to the trigger on close. The readout below shows the opened model, which the trigger reflects as aria-expanded, and the id of the focused element, so the keyboard semantics are observable.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA aria-expanded',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-expanded',
    },
    {
      label: 'WAI-ARIA APG: Dialog (Modal) Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    },
    {
      label: 'WCAG 2.4.3 Focus Order',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html',
    },
  ],
  apiComponents: ['CngxDrawer', 'CngxDrawerPanel', 'CngxAriaExpanded'],
  moduleImports: [
    "import { CngxDrawer, CngxDrawerPanel } from '@cngx/common/layout';",
    "import { CngxAriaExpanded } from '@cngx/common/a11y';",
    "import { CngxStack } from '@cngx/ui/layout';",
  ],
  imports: ['CngxDrawer', 'CngxDrawerPanel', 'CngxAriaExpanded', 'CngxStack'],
  setup: `protected readonly focusedId = signal<string>('(none)');
  protected onFocusIn(ev: FocusEvent): void {
    const t = ev.target as HTMLElement | null;
    this.focusedId.set(t?.id || '(no id)');
  }
  protected onFocusOut(ev: FocusEvent): void {
    if (!(ev.relatedTarget instanceof HTMLElement)) {
      this.focusedId.set('(none)');
    }
  }`,
  template: `  <div cngxDrawer #drawer="cngxDrawer"
       (focusin)="onFocusIn($event)" (focusout)="onFocusOut($event)"
       class="cngx-drawer">
    <nav id="pcw-panel" [cngxDrawerPanel]="drawer" position="left"
         role="navigation" aria-label="Primary">
      <cngx-stack gap="sm" align="start" style="padding: var(--cngx-space-md, 1rem)">
        <strong>Sidebar</strong>
        <button id="pcw-link-home" type="button">Home</button>
        <button id="pcw-link-profile" type="button">Profile</button>
        <button id="pcw-close" type="button" (click)="drawer.close()">Close</button>
      </cngx-stack>
    </nav>

    <main style="flex: 1 1 auto; padding: var(--cngx-space-md, 1rem)">
      <button id="pcw-trigger" type="button"
              [cngxAriaExpanded]="drawer.opened()" [controls]="'pcw-panel'"
              (click)="drawer.toggle()">
        {{ drawer.opened() ? 'Close' : 'Open' }} navigation
      </button>
      <p>Open the navigation, then Tab through the panel. Focus stays trapped inside until the drawer closes; on close, the trigger re-receives focus.</p>
    </main>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top: 12px">
    <div class="event-row">
      <span class="event-label">drawer.opened()</span>
      <span class="event-value">{{ drawer.opened() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">trigger aria-expanded (from drawer.opened())</span>
      <span class="event-value">{{ drawer.opened() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">focused id</span>
      <span class="event-value">{{ focusedId() }}</span>
    </div>
  </div>`,
};
