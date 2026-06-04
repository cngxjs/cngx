import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChipInteraction: Removable with (removeRequest) on Backspace / Delete',
  subtitle: 'Backspace and Delete fire the <code>(removeRequest)</code> output; the consumer decides what removal means. Click on the chip body still toggles selection; click on the close button fires <code>(remove)</code> from <code>&lt;cngx-chip&gt;</code> without a double-toggle.',
  description: 'Removal contract on <code>[cngxChipInteraction]</code>: a <code>keydown</code> handler for <code>Backspace</code> and <code>Delete</code> fires <code>(removeRequest)</code> as an output (not a state mutation), so the consumer decides whether removal means dropping the entry, deselecting, or something else. Rendering <code>[removable]="true"</code> on the underlying <code>&lt;cngx-chip&gt;</code> adds a close <code>&lt;button type="button"&gt;</code> with an <code>aria-label</code> (defaulting to "Remove"; override via <code>[removeAriaLabel]</code>) that fires <code>(remove)</code>. A close-button click guard inside the directive prevents the chip body click from double-toggling.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxChipInteraction',
    'CngxChip',
    'CNGX_CONTROL_VALUE',
  ],
  moduleImports: [
    'import { CngxChipInteraction } from \'@cngx/common/interactive\';',
    'import { CngxChip } from \'@cngx/common/display\';',
  ],
  imports: ['CngxChipInteraction', 'CngxChip'],
  references: [
    { label: 'WCAG 2.1 SC 4.1.2 Name, Role, Value', href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html' },
    { label: 'WCAG 2.1 SC 2.1.1 Keyboard', href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html' },
    { label: 'WAI-ARIA 1.2: `aria-label`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-label' },
  ],
  setup: `protected readonly favourite = signal(false);
  protected readonly onRemove = (): void => {
    this.tagRemoved.update((n) => n + 1);
  };`,
  setupChrome: `protected readonly tagRemoved = signal(0);`,
  template: `
  <cngx-chip
    cngxChipInteraction
    [value]="'tag'"
    [(selected)]="favourite"
    [removable]="true"
    (removeRequest)="onRemove()"
    (remove)="onRemove()"
  >Removable tag</cngx-chip>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">remove fired</span>
      <span class="event-value">{{ tagRemoved() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">selected</span>
      <span class="event-value">{{ favourite() }}</span>
    </div>
  </div>`,
};
