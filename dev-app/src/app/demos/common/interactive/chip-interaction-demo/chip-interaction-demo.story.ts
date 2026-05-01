import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Chip interaction (standalone)',
  navLabel: 'Chip interaction',
  navCategory: 'interactive',
  description:
    'Standalone interactive chip atom — applies <code>[cngxChipInteraction]</code> ' +
    'onto the existing <code>&lt;cngx-chip&gt;</code> display pill and adds ' +
    '<code>role="option"</code> selection semantics with a local-owned <code>selected</code> ' +
    'model. Provides <code>CNGX_CONTROL_VALUE</code> so <code>CngxFormBridge</code> can ' +
    'adapt it to Reactive Forms. Use this when a chip stands alone (filter tag, single ' +
    'suggestion); use <code>[cngxChipInGroup]</code> instead for chips inside a chip-group.',
  apiComponents: ['CngxChipInteraction', 'CngxChip', 'CNGX_CONTROL_VALUE'],
  moduleImports: [
    "import { CngxChipInteraction } from '@cngx/common/interactive';",
    "import { CngxChip } from '@cngx/common/display';",
  ],
  setup: `
  protected readonly favourite = signal(false);
  protected readonly featured = signal(true);
  protected readonly tagRemoved = signal(0);
  protected readonly locked = signal(false);
  `,
  sections: [
    {
      title: 'Basic — toggle on click, Space, or Enter',
      subtitle:
        'The chip exposes <code>[(selected)]</code> as a two-way model. Click, Space, or ' +
        'Enter flips it; ARIA <code>aria-selected</code> reflects the state reactively.',
      imports: ['CngxChipInteraction', 'CngxChip'],
      template: `
  <cngx-chip cngxChipInteraction [value]="'favourite'" [(selected)]="favourite">Favourite</cngx-chip>
  <cngx-chip cngxChipInteraction [value]="'featured'" [(selected)]="featured">Featured</cngx-chip>
  <p class="caption">favourite: <code>{{ favourite() }}</code> • featured: <code>{{ featured() }}</code></p>`,
    },
    {
      title: 'Removable with (removeRequest) on Backspace / Delete',
      subtitle:
        'Backspace and Delete fire the <code>(removeRequest)</code> output — the consumer ' +
        'decides what removal means. Click on the chip body still toggles selection; ' +
        'click on the close button fires <code>(remove)</code> from <code>&lt;cngx-chip&gt;</code> ' +
        '(no double-toggle).',
      imports: ['CngxChipInteraction', 'CngxChip'],
      template: `
  <cngx-chip
    cngxChipInteraction
    [value]="'tag'"
    [(selected)]="favourite"
    [removable]="true"
    (removeRequest)="tagRemoved.set(tagRemoved() + 1)"
    (remove)="tagRemoved.set(tagRemoved() + 1)"
  >Removable tag</cngx-chip>
  <p class="caption">remove fired: <code>{{ tagRemoved() }}</code></p>`,
    },
    {
      title: 'Disabled state',
      subtitle:
        'When <code>[disabled]="true"</code>, click + keyboard + remove are silently ' +
        'short-circuited; <code>aria-disabled="true"</code> and <code>tabindex=-1</code> ' +
        'reflect the state.',
      imports: ['CngxChipInteraction', 'CngxChip'],
      template: `
  <cngx-chip cngxChipInteraction [value]="'locked'" [disabled]="locked()" [(selected)]="favourite">
    Locked tag
  </cngx-chip>
  <button type="button" (click)="locked.set(!locked())">toggle disabled</button>`,
    },
  ],
};
