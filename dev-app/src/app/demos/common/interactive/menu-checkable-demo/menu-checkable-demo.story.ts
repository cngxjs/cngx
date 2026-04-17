import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Checkable Menu Items',
  navLabel: 'MenuCheckable',
  navCategory: 'interactive',
  description:
    'Menu items with their own state: checkboxes for toggles, radios for mutually exclusive choices inside a CngxMenuGroup.',
  apiComponents: ['CngxMenuItemCheckbox', 'CngxMenuItemRadio', 'CngxMenuGroup'],
  overview:
    '<p><code>[cngxMenuItemCheckbox]</code> renders <code>role="menuitemcheckbox"</code> with a ' +
    'two-way <code>[(checked)]</code> model. <code>[cngxMenuItemRadio]</code> renders ' +
    '<code>role="menuitemradio"</code> and is mutually exclusive inside a <code>[cngxMenuGroup]</code>.</p>',
  moduleImports: [
    "import { CngxMenu, CngxMenuGroup, CngxMenuItemCheckbox, CngxMenuItemRadio } from '@cngx/common/interactive';",
  ],
  setup: `
  protected readonly bold = signal(true);
  protected readonly italic = signal(false);
  protected readonly underline = signal(false);
  `,
  sections: [
    {
      title: 'Text formatting menu',
      subtitle:
        'Checkboxes for independent toggles, radios inside a group for exclusive selection.',
      imports: ['CngxMenu', 'CngxMenuGroup', 'CngxMenuItemCheckbox', 'CngxMenuItemRadio'],
      template: `
  <ul cngxMenu [label]="'Text formatting'" class="menu" tabindex="0">
    <li cngxMenuItemCheckbox value="bold" [(checked)]="bold">
      Bold
    </li>
    <li cngxMenuItemCheckbox value="italic" [(checked)]="italic">
      Italic
    </li>
    <li cngxMenuItemCheckbox value="underline" [(checked)]="underline">
      Underline
    </li>
    <li role="separator" class="sep"></li>
    <div cngxMenuGroup [label]="'Alignment'" name="alignment">
      <li cngxMenuItemRadio value="left">Left</li>
      <li cngxMenuItemRadio value="center">Center</li>
      <li cngxMenuItemRadio value="right">Right</li>
    </div>
  </ul>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Bold</span>
      <span class="event-value">{{ bold() ? 'on' : 'off' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Italic</span>
      <span class="event-value">{{ italic() ? 'on' : 'off' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Underline</span>
      <span class="event-value">{{ underline() ? 'on' : 'off' }}</span>
    </div>
  </div>`,
      css: `.menu {
  list-style: none;
  margin: 0;
  padding: 4px;
  width: 240px;
  border: 1px solid var(--cngx-surface-border, #d0d5dd);
  border-radius: var(--cngx-radius-md, 8px);
  background: var(--cngx-surface-default, #fff);
  outline: none;
}
.menu:focus-visible {
  outline: 2px solid var(--cngx-focus-ring, #4a8cff);
  outline-offset: 2px;
}
.menu [cngxMenuItemCheckbox], .menu [cngxMenuItemRadio] {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
}
.cngx-menu-item--highlighted {
  background: var(--cngx-menu-highlight-bg, rgba(74, 140, 255, 0.15));
}
.cngx-menu-item--checked::before {
  content: '\\2713';
  width: 1em;
  margin-right: 4px;
}
[cngxMenuItemRadio].cngx-menu-item--checked::before {
  content: '\\2022';
}
.sep {
  height: 1px;
  background: var(--cngx-surface-border, #d0d5dd);
  margin: 4px 0;
}`,
    },
  ],
};
