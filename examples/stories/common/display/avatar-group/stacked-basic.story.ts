import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAvatarGroup: Stacked basic',
  subtitle:
    'Project <code>&lt;cngx-avatar&gt;</code> children; the group overlaps them into a stack with a ring around each disc.',
  description:
    'With no <code>[max]</code> every avatar shows. The group sets a single <code>aria-label</code> summarising the count, so assistive tech hears the group as one named unit rather than reading each disc.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxAvatarGroup', 'CngxAvatar'],
  imports: ['CngxAvatarGroup', 'CngxAvatar'],
  setup: `protected readonly team = ['AK', 'JD', 'MR', 'PL'];`,
  template: `  <cngx-avatar-group label="team members">
    @for (initials of team; track initials) {
      <cngx-avatar [initials]="initials" />
    }
  </cngx-avatar-group>`,
};
