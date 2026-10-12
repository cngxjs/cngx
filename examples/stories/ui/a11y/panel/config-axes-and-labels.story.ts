import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxA11yPanel: Config axes and labels',
  subtitle:
    'A scoped <code>provideA11yPanelConfigAt(...)</code> reshapes the panel without a single input: <code>withA11yPanelAxes</code> keeps two axes in a new order with fewer, relabelled options, <code>withA11yPanelLabels</code> renames the heading, the group labels, the Reset control and the Reset announcement.',
  description:
    'The panel below renders only text size and contrast, text size first, because the configured axis list replaces the default four wholesale. An option without its own <code>label</code> (<code>auto</code> under Contrast) keeps the language-pack label for its value. The group labels are the visible names of the radiogroups (<code>aria-labelledby</code>). The Reset announcement is not visible: press Reset and the readout mirrors what the shared live region announced. The panel writes the app-wide preferences, so a pick here re-themes this page like the default panel does.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WCAG 4.1.3 Status Messages',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages',
    },
  ],
  apiComponents: ['CngxA11yPanel'],
  moduleImports: [
    "import { DestroyRef } from '@angular/core';",
    "import { DOCUMENT } from '@angular/common';",
    "import { CngxA11yPanel, provideA11yPanelConfigAt, withA11yPanelAxes, withA11yPanelLabels } from '@cngx/ui/a11y';",
  ],
  imports: ['CngxA11yPanel'],
  viewProviders: [
    `provideA11yPanelConfigAt(
      withA11yPanelAxes([
        {
          axis: 'textScale',
          reset: 'md',
          options: [
            { value: 'md', label: 'Standard' },
            { value: 'lg', label: 'Larger' },
          ],
        },
        {
          axis: 'contrast',
          reset: 'auto',
          options: [{ value: 'more', label: 'High' }, { value: 'auto' }],
        },
      ]),
      withA11yPanelLabels({
        heading: 'Reading comfort',
        axes: { textScale: 'Font size', contrast: 'Color contrast' },
        reset: 'Restore defaults',
        resetMessage: 'Reading comfort restored to the defaults',
      }),
    )`,
  ],
  template: `<cngx-a11y-panel style="max-width:32rem" />`,
  setupChrome: `private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly announced = signal('-');

  private readonly mirror = afterNextRender(() => {
    const observer = new MutationObserver(() => {
      const regions = Array.from(this.doc.querySelectorAll('span.cngx-sr-only[aria-live]'));
      const text = regions.map((region) => region.textContent?.trim() ?? '').find((t) => t.length > 0);
      if (text) {
        this.announced.set(text);
      }
    });
    observer.observe(this.doc.body, { childList: true, subtree: true, characterData: true });
    this.destroyRef.onDestroy(() => observer.disconnect());
  });`,
  templateChrome: `<div class="event-grid" style="margin-top:16px">
    <div class="event-row"><span class="event-label">Last announcement</span><span class="event-value">{{ announced() }}</span></div>
  </div>`,
};
