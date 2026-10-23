import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: Start and end slots',
  subtitle: 'Icons, counts and shortcut hints project before or after the label and scale with it.',
  description: 'Mark projected content with <code>cngxButtonStart</code> or <code>cngxButtonEnd</code>. Slot content is sized in <code>em</code>, so it follows the button size and the text scale, and a filled slot trims the padding on its side so the icon does not float. A decorative icon carries <code>aria-hidden="true"</code>; the label stays the accessible name. A <code>cngx-icon</code> in a slot scales the same way. A count badge is decorative too, so its number goes into <code>aria-label</code>.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: ['CngxButton', 'CngxButtonStart', 'CngxButtonEnd', 'CngxIcon', 'CngxBadge'],
  moduleImports: [
    "import { CngxButton, CngxButtonEnd, CngxButtonStart } from '@cngx/common/button';",
    "import { CngxBadge, CngxIcon } from '@cngx/common/display';",
  ],
  imports: ['CngxButton', 'CngxButtonStart', 'CngxButtonEnd', 'CngxIcon', 'CngxBadge'],
  template: `
  <div style="display:flex; flex-wrap:wrap; align-items:center; gap:12px">
    <button cngxButton tone="primary">
      <svg cngxButtonStart aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
      New item
    </button>
    <button cngxButton="outline">
      Export
      <svg cngxButtonEnd aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6" /></svg>
    </button>
    <button cngxButton="secondary">
      Search
      <kbd cngxButtonEnd>/</kbd>
    </button>
    <button cngxButton="outline" size="sm">
      <svg cngxButtonStart aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
      Delete
    </button>
    <button cngxButton="ghost">
      <cngx-icon cngxButtonStart>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
      </cngx-icon>
      Download
    </button>
    <button cngxButton="outline" [cngxBadge]="4" aria-label="Inbox, 4 unread">Inbox</button>
  </div>`,
};
