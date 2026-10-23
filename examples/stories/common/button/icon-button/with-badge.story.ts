import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIconButton: With a badge',
  subtitle: 'Compose <code>cngxBadge</code> on the same host; the count goes into the accessible name.',
  description: 'The badge is decorative (<code>aria-hidden</code>), so the number a sighted user reads has to reach a screen reader through the button name: bind it into <code>aria-label</code>. The icon button is positioned, so the badge anchors to its corner. Add notifications to watch both update.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxIconButton', 'CngxBadge'],
  moduleImports: [
    "import { CngxIconButton } from '@cngx/common/button';",
    "import { CngxBadge } from '@cngx/common/display';",
  ],
  imports: ['CngxIconButton', 'CngxBadge'],
  setup: `
  protected readonly unread = signal(3);`,
  template: `
  <button
    cngxIconButton="outline"
    [cngxBadge]="unread()"
    [hidden]="unread() === 0"
    [attr.aria-label]="'Notifications, ' + unread() + ' unread'"
  >
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2zM10 20h4" /></svg>
  </button>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="unread.update((n) => n + 1)">Add notification</button>
    <button type="button" (click)="unread.set(0)">Mark all read</button>
  </div>`,
};
