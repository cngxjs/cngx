import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActiveDescendant: Horizontal option row',
  subtitle:
    '<code>orientation="horizontal"</code> moves the active option with ArrowLeft and ArrowRight instead of ArrowUp and ArrowDown. Under <code>dir="rtl"</code> the arrows follow reading order, so ArrowLeft moves forward.',
  description:
    'Same focus model as the vertical listbox: focus stays on the host and <code>aria-activedescendant</code> names the active option. The horizontal arrows resolve through the shared inline-step helper that roving tabindex uses, so they read the live text direction. The host sets <code>aria-orientation="horizontal"</code> itself, because a listbox defaults to vertical.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxActiveDescendant'],
  moduleImports: [
    "import { CngxActiveDescendant, type ActiveDescendantItem } from '@cngx/common/a11y';",
  ],
  imports: ['CngxActiveDescendant'],
  references: [
    {
      label: 'WAI-ARIA APG: Listbox pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/',
    },
  ],
  setup: `protected readonly sizes = signal<ActiveDescendantItem[]>([
    { id: 'size-s', value: 's', label: 'Small' },
    { id: 'size-m', value: 'm', label: 'Medium' },
    { id: 'size-l', value: 'l', label: 'Large' },
    { id: 'size-xl', value: 'xl', label: 'Extra large' },
  ]);`,
  template: `  <div class="cngx-ad-listbox"
       style="display:flex;flex-wrap:wrap;gap:4px;max-width:420px"
       cngxActiveDescendant
       orientation="horizontal"
       [autoHighlightFirst]="true"
       role="listbox"
       aria-orientation="horizontal"
       aria-label="Size"
       tabindex="0"
       [items]="sizes()"
       #adH="cngxActiveDescendant">
    @for (size of sizes(); track size.id) {
      <div role="option"
           [id]="size.id"
           [attr.aria-selected]="adH.activeIndex() === $index"
           [class.cngx-option--highlighted]="adH.activeIndex() === $index"
           class="cngx-ad-option">
        {{ size.label }}
      </div>
    }
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">Active id</span>
      <span class="event-value">{{ adH.activeId() ?? 'none' }}</span>
    </div>
  </div>`,
};
