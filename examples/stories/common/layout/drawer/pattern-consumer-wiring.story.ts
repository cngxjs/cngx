import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Pattern — Consumer Wiring',
  subtitle: 'The drawer system is fully headless. Directives set CSS classes; the consumer styles them. <code>CngxAriaExpanded</code> and <code>CngxFocusTrap</code> are wired by the consumer — not auto-injected.',
  description: 'Headless drawer/sidebar system: CngxDrawer (state), CngxDrawerPanel (sliding panel), CngxDrawerContent (content offset). Supports left/right/top/bottom, focus trapping, click-outside close, Escape key, and controlled+uncontrolled modes.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxDrawer',
    'CngxDrawerPanel',
    'CngxDrawerContent',
  ],
  moduleImports: [
    'import { CngxAriaExpanded } from \'@cngx/common\';',
  ],
  template: `
  <pre class="code-block"><code>&lt;div cngxDrawer #drawer="cngxDrawer"&gt;
  &lt;!-- Consumer wires CngxAriaExpanded on the trigger --&gt;
  &lt;button [cngxAriaExpanded]="drawer.opened()"
          [controls]="'sidebar'" (click)="drawer.toggle()"&gt;
    Menu
  &lt;/button&gt;

  &lt;!-- CngxFocusTrap is a hostDirective — consumer binds [enabled] --&gt;
  &lt;nav [cngxDrawerPanel]="drawer" position="left"
       [enabled]="drawer.opened()" [autoFocus]="true"
       id="sidebar" role="navigation"&gt;
    ...
  &lt;/nav&gt;

  &lt;!-- Optional: content shifts via CSS --&gt;
  &lt;main [cngxDrawerContent]="drawer"&gt;...&lt;/main&gt;

  &lt;!-- Optional: backdrop is pure CSS --&gt;
  &lt;div class="backdrop" [class.visible]="drawer.opened()"
       (click)="drawer.close()"&gt;&lt;/div&gt;
&lt;/div&gt;</code></pre>`,
};
