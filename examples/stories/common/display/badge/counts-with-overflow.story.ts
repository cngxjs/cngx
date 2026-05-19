import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Counts with overflow',
  subtitle: 'Values over <code>max</code> render as <code>{max}+</code>.',
  description: 'Floating counter / dot indicator attached to any host element. Purely visual — semantics live on the host via aria-label.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxBadge',
  ],
  moduleImports: [
    'import { CngxBadge } from \'@cngx/common/display\';',
  ],
  imports: ['CngxBadge'],
  template: `
  <div class="row">
    <button type="button" class="chip" [cngxBadge]="3">Inbox</button>
    <button type="button" class="chip" [cngxBadge]="12">Tasks</button>
    <button type="button" class="chip" [cngxBadge]="250" [max]="99">Notifications</button>
  </div>`,
  css: `.row { display: flex; gap: 16px; align-items: center; }
.chip {
  position: relative;
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid var(--cngx-color-border, #d0d5dd);
  background: var(--cngx-color-surface, #fff);
  cursor: pointer;
  font-size: 0.875rem;
}
.cngx-badge-indicator {
  position: absolute;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  background: var(--cngx-badge-primary-bg, #4a8cff);
  color: var(--cngx-badge-primary-color, #fff);
  pointer-events: none;
}
.cngx-badge-indicator--error { background: var(--cngx-badge-error-bg, #ef4444); }
.cngx-badge-indicator--warning { background: var(--cngx-badge-warning-bg, #f59e0b); color: #111; }
.cngx-badge-indicator--neutral { background: var(--cngx-badge-neutral-bg, #9aa3ac); }
.cngx-badge-indicator--dot {
  min-width: 10px;
  width: 10px;
  height: 10px;
  padding: 0;
}
.cngx-badge-indicator--above-end { top: -6px; right: -6px; }
.cngx-badge-indicator--above-start { top: -6px; left: -6px; }
.cngx-badge-indicator--below-end { bottom: -6px; right: -6px; }
.cngx-badge-indicator--below-start { bottom: -6px; left: -6px; }
.cngx-badge-indicator--inline {
  position: relative;
  display: inline-block;
  margin-left: 6px;
}`,
};
