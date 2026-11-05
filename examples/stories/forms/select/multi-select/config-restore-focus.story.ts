import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMultiSelect: close without focus restore via withRestoreFocus',
  subtitle:
    '<code>provideSelectConfigAt(withRestoreFocus(false))</code> turns off focus restoration for the subtree, so closing the non-modal panel leaves focus where it landed instead of returning it to the trigger. The default (<code>true</code>) returns focus to the trigger on close. A per-instance input still wins; the mobile sheet keeps its own focus trap.',
  description:
    'Open the panel, pick a couple of options, then press Escape or click outside. The readout mirrors the focused element after close - with restore off it is not the trigger.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  framework: 'template-only',
  apiComponents: ['CngxMultiSelect'],
  moduleImports: [
    "import { CngxMultiSelect, provideSelectConfigAt, withRestoreFocus, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxMultiSelect'],
  viewProviders: ['...provideSelectConfigAt(withRestoreFocus(false))'],
  setup: `protected readonly toppings: CngxSelectOptionDef<string>[] = [
    { value: 'basil', label: 'Basil' },
    { value: 'olives', label: 'Olives' },
    { value: 'onion', label: 'Onion' },
    { value: 'pepper', label: 'Pepper' },
  ];
  protected readonly picked = signal<string[]>([]);`,
  setupChrome: `protected readonly focusedAfterClose = signal('-');
  protected handleOpenedChange(open: boolean): void {
    if (open) {
      this.focusedAfterClose.set('panel open');
      return;
    }
    setTimeout(() => {
      const el = document.activeElement as HTMLElement | null;
      const role = el?.getAttribute('role');
      this.focusedAfterClose.set(el ? el.tagName.toLowerCase() + (role ? ' [role=' + role + ']' : '') : 'none');
    });
  }`,
  template: `<cngx-multi-select
  [label]="'Toppings'"
  [options]="toppings"
  [(values)]="picked"
  (openedChange)="handleOpenedChange($event)"
/>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Focused after close</span><span class="event-value">{{ focusedAfterClose() }}</span></div>
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ picked().join(', ') || '-' }}</span></div>
  </div>`,
};
