import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: default panel class via withPanelClass',
  subtitle:
    "<code>provideSelectConfigAt(withPanelClass('demo-select-config-panel'))</code> adds a class to every select panel in the subtree, the hook for consumer panel styling. Here the demo class tints the panel and draws an accent bar; a per-instance <code>[panelClass]</code> adds to it rather than replacing it.",
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'template-only',
  apiComponents: ['CngxSelect'],
  moduleImports: [
    "import { CngxSelect, provideSelectConfigAt, withPanelClass, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxSelect'],
  viewProviders: ["...provideSelectConfigAt(withPanelClass('demo-select-config-panel'))"],
  setup: `protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
  ];
  protected readonly colour = signal<string | undefined>(undefined);
  protected readonly open = signal(false);`,
  template: `<cngx-select
  [label]="'Colour'"
  [options]="colors"
  [(value)]="colour"
  (openedChange)="open.set($event)"
  placeholder="Pick a colour…"
/>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Panel</span><span class="event-value">{{ open() ? 'open - carries demo-select-config-panel' : 'closed' }}</span></div>
  </div>`,
  css: `.demo-select-config-panel {
  background: var(--cngx-color-surface-raised, #f4f6ff);
  border-inline-start: 3px solid var(--cngx-color-primary, #3f51b5);
}`,
};
