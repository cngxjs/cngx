import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAvatarGroup: Overflow pill',
  subtitle:
    'With <code>[max]="3"</code> the group shows three avatars and collapses the rest into a <code>+N</code> pill.',
  description:
    'The visible/hidden split is a <code>computed()</code> over the projected avatars and <code>[max]</code>; the pill count and the <code>aria-label</code> ("8 reviewers, 5 not shown") both derive from it.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxAvatarGroup', 'CngxAvatar'],
  imports: ['CngxAvatarGroup', 'CngxAvatar'],
  setup: `protected readonly reviewers = ['AK', 'JD', 'MR', 'PL', 'ST', 'BW', 'CN', 'EH'];`,
  template: `  <cngx-avatar-group [max]="3" label="reviewers">
    @for (initials of reviewers; track initials) {
      <cngx-avatar [initials]="initials" />
    }
  </cngx-avatar-group>`,
};
