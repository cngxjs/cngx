import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMotionScope: reduce one section',
  subtitle:
    '<code>[cngxMotionScope]="\'reduced\'"</code> reflects <code>data-motion</code> onto one section, so the shipped safety net collapses motion for that subtree while the rest of the page keeps animating.',
  description:
    "Both panels hold a spinner and a shimmering skeleton line. The right panel carries <code>cngxMotionScope</code>; because the <code>motion-tokens.css</code> safety net is unanchored, <code>data-motion='reduced'</code> on the section collapses <code>animation-duration</code> and <code>transition-duration</code> for its descendants only. The skeleton shimmer freezes, while the spinner (a <code>role='status'</code> host) switches to a slow opacity pulse instead of dying into a frozen ring - the essential-motion carve-out. The input accepts only <code>reduced</code> and <code>full</code>: <code>auto</code> means \"follow the OS query\" and lives on <code>provideMotion()</code> at the root. A subtree <code>full</code> does not re-enable motion against an OS reduce preference; that escape is root-only. If your OS already asks for reduced motion, both panels are reduced and the toggle shows no difference.",
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxMotionScope', 'injectMotion'],
  moduleImports: [
    "import { CngxMotionScope, injectMotion } from '@cngx/core';",
    "import { CngxToggle } from '@cngx/common/interactive';",
    "import { CngxSkeleton } from '@cngx/common/layout';",
    "import { CngxLoadingIndicator } from '@cngx/ui/feedback';",
  ],
  imports: ['CngxMotionScope', 'CngxToggle', 'CngxSkeleton', 'CngxLoadingIndicator'],
  references: [
    {
      label: 'WCAG 2.3.3 Animation from Interactions',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html',
    },
  ],
  setup: `
  protected readonly reduceSection = signal(true);`,
  template: `
  <div class="demo-scope-compare">
    <section class="demo-scope-panel" aria-labelledby="motion-root-h">
      <h3 id="motion-root-h">Root motion</h3>
      <p>No directive - follows the document preference.</p>
      <cngx-loading-indicator [loading]="true" [delay]="0" variant="spinner" label="Loading report" />
      <div [cngxSkeleton]="true" class="demo-skeleton-line"></div>
    </section>

    <section
      class="demo-scope-panel"
      [cngxMotionScope]="reduceSection() ? 'reduced' : undefined"
      aria-labelledby="motion-scoped-h"
    >
      <h3 id="motion-scoped-h">Scoped motion</h3>
      <p>Carries cngxMotionScope - motion reduced for this subtree only.</p>
      <cngx-loading-indicator [loading]="true" [delay]="0" variant="spinner" label="Loading report" />
      <div [cngxSkeleton]="true" class="demo-skeleton-line"></div>
    </section>
  </div>`,
  templateChromeBefore: `
  <div class="cngx-ex-chrome" style="margin-bottom:12px">
    Toggle the scope on the right-hand section: its skeleton shimmer stops and
    its spinner falls back to a pulse, while the left panel keeps animating.
  </div>
  <div style="margin-bottom:20px">
    <cngx-toggle [(value)]="reduceSection">Reduce motion in the right section</cngx-toggle>
  </div>`,
  setupChrome: `
  protected readonly rootMotion = injectMotion();
  protected readonly scope = viewChild(CngxMotionScope);`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">injectMotion() (root)</span>
      <span class="event-value">{{ rootMotion() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">CngxMotionScope.motion() (section)</span>
      <span class="event-value">{{ scope()?.motion() ?? 'unset' }}</span>
    </div>
  </div>`,
};
