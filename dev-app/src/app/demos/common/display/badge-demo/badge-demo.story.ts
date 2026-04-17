import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Badge',
  navLabel: 'Badge',
  navCategory: 'display',
  description:
    'Floating counter / dot indicator attached to any host element. Purely visual — semantics live on the host via aria-label.',
  apiComponents: ['CngxBadge'],
  overview:
    '<p><code>[cngxBadge]</code> accepts a number, string, or boolean. Numbers respect <code>max</code> (default 99). ' +
    'Boolean <code>true</code> renders as a solid dot. String values render verbatim.</p>',
  moduleImports: ["import { CngxBadge } from '@cngx/common/display';"],
  sections: [
    {
      title: 'Counts with overflow',
      subtitle: 'Values over <code>max</code> render as <code>{max}+</code>.',
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
  border: 1px solid var(--cngx-surface-border, #d0d5dd);
  background: var(--cngx-surface-default, #fff);
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
    },
    {
      title: 'Colors and dot mode',
      subtitle: 'Boolean <code>true</code> flips to dot mode (no text).',
      imports: ['CngxBadge'],
      template: `
  <div class="row">
    <button type="button" class="chip" [cngxBadge]="1" color="error">Errors</button>
    <button type="button" class="chip" [cngxBadge]="5" color="warning">Warnings</button>
    <button type="button" class="chip" [cngxBadge]="2" color="neutral">Drafts</button>
    <button type="button" class="chip" [cngxBadge]="true" color="error" aria-label="new notifications">Live</button>
  </div>`,
    },
    {
      title: 'Inline and hidden',
      subtitle:
        'Inline renders after the host content. Hidden tears the badge out of the DOM — useful for toggle states.',
      imports: ['CngxBadge'],
      template: `
  <div class="row">
    <span [cngxBadge]="'NEW'" position="inline" color="warning">Feature</span>
    <button type="button" class="chip" [cngxBadge]="3" [hidden]="true">Hidden</button>
  </div>`,
    },
  ],
};
