import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAutofocus: Focus on insert',
  subtitle: 'Toggle the search bar. The input is automatically focused when it appears.',
  description:
    'Focuses the input on every <code>@if</code> mount: the directive fires on insertion, so the consumer does not need an <code>afterNextRender</code> or <code>ViewChild</code> dance. Covers the case the native <code>autofocus</code> attribute does not handle reliably for dynamically inserted form controls.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxAutofocus'],
  moduleImports: ["import { CngxAutofocus } from '@cngx/common/a11y';"],
  imports: ['CngxAutofocus'],
  references: [
    {
      label: 'WCAG 2.1 SC 2.4.3 Focus Order',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html',
    },
    {
      label: 'HTML Living Standard: autofocusing a form control',
      href: 'https://html.spec.whatwg.org/multipage/interaction.html#autofocusing-a-form-control',
    },
  ],
  setup: `protected readonly showSearch = signal(false);`,
  template: `  <button type="button" (click)="showSearch.set(!showSearch())" class="chip">
    {{ showSearch() ? 'Hide search' : 'Show search' }}
  </button>

  @if (showSearch()) {
    <div style="margin-top:12px;display:flex;flex-direction:column;gap:4px;max-width:240px">
      <label for="cngx-autofocus-insert">Search query</label>
      <input id="cngx-autofocus-insert"
             type="search"
             [cngxAutofocus]="true"
             placeholder="Search..." />
    </div>
  }`,
};
