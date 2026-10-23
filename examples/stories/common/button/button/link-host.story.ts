import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: On an anchor',
  subtitle: '<code>a[cngxButton]</code> keeps link semantics: <code>href</code>, <code>routerLink</code>, middle click, no <code>type</code>.',
  description: 'Navigation belongs on an <code>&lt;a&gt;</code>, even when it looks like a button. On an anchor host the button renders no <code>type</code> attribute and leaves link behaviour to the browser and the router. The <code>link</code> variant reads as inline text inside a sentence and is the only variant without the control height and touch floor (inline links are exempt under WCAG 2.5.8). A disabled anchor keeps focus and swallows navigation, including a middle click.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxButton'],
  moduleImports: ["import { CngxButton } from '@cngx/common/button';"],
  imports: ['CngxButton'],
  template: `
  <div style="display:flex; flex-direction:column; gap:16px">
    <div style="display:flex; flex-wrap:wrap; align-items:center; gap:12px">
      <a cngxButton tone="primary" href="https://angular.dev/overview" target="_blank" rel="noopener">Angular overview</a>
      <a cngxButton="outline" href="https://angular.dev/guide/signals" target="_blank" rel="noopener">Signals guide</a>
      <a cngxButton="outline" href="https://angular.dev/reference" target="_blank" rel="noopener" disabled disabledReason="The reference is offline for maintenance.">API reference</a>
    </div>
    <p style="margin:0">
      Read the <a cngxButton="link" tone="primary" href="https://angular.dev/installation" target="_blank" rel="noopener">installation guide</a> before you upgrade.
    </p>
  </div>`,
};
