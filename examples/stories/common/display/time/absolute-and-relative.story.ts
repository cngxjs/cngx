import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTime: Absolute and relative',
  subtitle:
    'One <code>&lt;time&gt;</code> atom, two modes: a calendar date via <code>Intl.DateTimeFormat</code> or a distance-from-now via <code>Intl.RelativeTimeFormat</code>.',
  description:
    'Each <code>&lt;cngx-time&gt;</code> writes a machine-readable ISO 8601 <code>datetime</code> attribute plus a localized human string. <code>mode="absolute"</code> (default) formats a calendar date and honours an explicit <code>[format]</code> of <code>Intl.DateTimeFormatOptions</code>; <code>mode="relative"</code> formats the signed distance from now (past or future). Formatting resolves against the app <code>LOCALE_ID</code> - English out of the box. Relative mode is render-time, not live-ticking.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxTime'],
  moduleImports: ["import { CngxTime } from '@cngx/common/display';"],
  imports: ['CngxTime'],
  references: [
    {
      label: 'MDN: Intl.RelativeTimeFormat',
      href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat',
    },
    {
      label: 'MDN: the <time> element',
      href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time',
    },
  ],
  setup: `  protected readonly published = new Date(Date.now() - 3 * 60 * 60 * 1000);
  protected readonly due = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);`,
  template: `
  <dl style="display:grid; grid-template-columns:auto auto; gap:8px 24px; align-items:baseline; margin:0">
    <dt>Absolute (default)</dt>
    <dd style="margin:0"><cngx-time [date]="published" /></dd>

    <dt>Absolute (<code>dateStyle: 'full'</code>)</dt>
    <dd style="margin:0"><cngx-time [date]="due" [format]="{ dateStyle: 'full' }" /></dd>

    <dt>Relative (past)</dt>
    <dd style="margin:0"><cngx-time [date]="published" mode="relative" /></dd>

    <dt>Relative (future)</dt>
    <dd style="margin:0"><cngx-time [date]="due" mode="relative" /></dd>
  </dl>`,
};
