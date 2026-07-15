import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxHoverIntent: Hover to reveal',
  subtitle:
    '<code>[cngxHoverIntent]</code> turns raw pointer enter/leave into a debounced boolean. The detail panel appears only after the pointer rests on the card for <code>enterDelay</code> ms - a pointer that merely passes over never triggers it.',
  description:
    'Rest the pointer on the card for ~150ms to reveal the detail panel; move away and it hides immediately (leaveDelay is 0). Sweep the pointer across without pausing and nothing happens - the pending timer is cancelled by pointerleave before it elapses. The tag mirrors the live active() signal.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxHoverIntent'],
  moduleImports: [
    "import { CngxHoverIntent } from '@cngx/common/interactive';",
    "import { CngxTag } from '@cngx/common/display';",
  ],
  imports: ['CngxHoverIntent', 'CngxTag'],
  template: `
  <div
    cngxHoverIntent
    #hi="cngxHoverIntent"
    [enterDelay]="150"
    style="display:inline-block; min-width:16rem; padding:1rem 1.25rem; border:1px solid var(--cngx-border, #d4d4d8); border-radius:0.5rem"
  >
    <strong>Project Aurora</strong>
    @if (hi.active()) {
      <p style="margin:0.5rem 0 0">Owner: Dana Ruiz · Updated 2h ago · 3 open tasks</p>
    }
  </div>`,
  templateChrome: `
  <div class="status-row" style="margin-top:0.75rem">
    <cngx-tag [color]="hi.active() ? 'success' : 'neutral'">
      active(): {{ hi.active() }}
    </cngx-tag>
  </div>`,
};
