import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxContextMenu: checkbox and radio items',
  subtitle:
    'Checkable rows. <code>cngx-context-menu-item-checkbox</code> two-way binds <code>[(checked)]</code>; a <code>[cngxMenuGroup]</code> scopes mutually-exclusive <code>cngx-context-menu-item-radio</code> rows to one selected value.',
  description:
    'Both shells forward to their brains (<code>CngxMenuItemCheckbox</code> / <code>CngxMenuItemRadio</code>), so <code>role="menuitemcheckbox"</code> / <code>role="menuitemradio"</code> and the reactive <code>aria-checked</code> come from the composition, not the shell. Radio exclusivity is owned by the enclosing group; the checked glyph is painted by the default theme.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu Pattern (menuitemcheckbox / menuitemradio)',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu/',
    },
  ],
  apiComponents: ['CngxContextMenu', 'CngxContextMenuItemCheckbox', 'CngxContextMenuItemRadio'],
  moduleImports: [
    "import { CngxContextMenu, CngxContextMenuDivider, CngxContextMenuFor, CngxContextMenuItemCheckbox, CngxContextMenuItemRadio } from '@cngx/ui/context-menu';",
    "import { CngxMenuGroup } from '@cngx/common/interactive';",
  ],
  imports: [
    'CngxContextMenu',
    'CngxContextMenuDivider',
    'CngxContextMenuFor',
    'CngxContextMenuItemCheckbox',
    'CngxContextMenuItemRadio',
    'CngxMenuGroup',
  ],
  setup: `protected readonly wrap = signal(true);
protected readonly density = signal<string>('cozy');`,
  template: `  <div
    class="demo-ctx-zone"
    tabindex="0"
    [cngxContextMenuFor]="menu"
    style="display:grid;place-items:center;min-block-size:140px;padding:24px;border:1px dashed var(--cngx-color-border, oklch(0.88 0.005 250));border-radius:8px;cursor:context-menu"
  >
    Right-click for view options
  </div>

  <cngx-context-menu ariaLabel="View options" #menu="cngxContextMenu">
    <cngx-context-menu-item-checkbox value="wrap" [(checked)]="wrap">
      Word wrap
    </cngx-context-menu-item-checkbox>
    <cngx-context-menu-divider />
    <div cngxMenuGroup label="Density" [(selectedValue)]="density">
      <cngx-context-menu-item-radio value="cozy">Cozy</cngx-context-menu-item-radio>
      <cngx-context-menu-item-radio value="comfortable">Comfortable</cngx-context-menu-item-radio>
      <cngx-context-menu-item-radio value="compact">Compact</cngx-context-menu-item-radio>
    </div>
  </cngx-context-menu>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Word wrap</span>
      <span class="event-value">{{ wrap() ? 'on' : 'off' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Density</span>
      <span class="event-value">{{ density() }}</span>
    </div>
  </div>`,
};
