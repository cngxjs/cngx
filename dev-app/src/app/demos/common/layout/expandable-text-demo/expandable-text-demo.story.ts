import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Expandable Text',
  navLabel: 'ExpandableText',
  navCategory: 'layout',
  description:
    'Molecule wrapping CngxTruncate with a built-in expand/collapse toggle and aria-expanded.',
  apiComponents: ['CngxExpandableText'],
  overview:
    '<p><code>cngx-expandable-text</code> wraps content in a truncated container with a toggle button. ' +
    'The button only appears when content actually overflows. <code>aria-expanded</code> is managed automatically.</p>',
  moduleImports: [
    "import { CngxExpandableText } from '@cngx/common/layout';",
  ],
  sections: [
    {
      title: 'Auto-Toggle',
      subtitle:
        'The "Show more" button appears only because the content exceeds 3 lines. Short text would show no button.',
      imports: ['CngxExpandableText'],
      template: `
  <div style="max-width:400px">
    <cngx-expandable-text [lines]="3" #exp="cngxExpandableText">
      Angular Signals represent a fundamental shift in how we think about reactivity.
      Instead of subscribing to streams and manually managing subscriptions, signals
      provide a synchronous, pull-based model where derived values are automatically
      tracked and updated. This eliminates entire categories of bugs related to
      subscription leaks, stale closures, and timing issues. The computed() function
      creates derived signals that update automatically when their dependencies change.
    </cngx-expandable-text>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">expanded</span>
      <span class="event-value">{{ exp.expanded() }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Custom Labels',
      subtitle: 'German labels, 2-line limit.',
      imports: ['CngxExpandableText'],
      template: `
  <div style="max-width:400px">
    <cngx-expandable-text [lines]="2" moreLabel="Mehr anzeigen" lessLabel="Weniger">
      CNGX ist die fehlende Kompositionsschicht zwischen Angular CDK und Angular Material.
      Es macht beides deklarativ, Signal-first und kommunikativ, ohne sie zu ersetzen.
      Jede Komponente ist dafuer verantwortlich, ihren Zustand vollstaendig zu kommunizieren.
    </cngx-expandable-text>
  </div>`,
    },
    {
      title: 'Custom Toggle Template',
      subtitle:
        'Use <code>ng-template[cngxExpandableToggle]</code> for a fully custom toggle — icon buttons, links, or any element.',
      imports: ['CngxExpandableText', 'CngxExpandableToggle'],
      template: `
  <div style="max-width:400px">
    <cngx-expandable-text [lines]="2">
      The native autofocus HTML attribute only works on initial page load.
      This directive handles dynamic content: dialogs, panels, stepper steps,
      and any element that appears after the initial render. It focuses the host
      element after the next render frame using afterNextRender.
      <ng-template cngxExpandableToggle let-expanded let-toggle="toggle">
        <button type="button" (click)="toggle()"
                [attr.aria-expanded]="expanded"
                style="display:inline-flex;align-items:center;gap:4px;margin-top:4px;
                       background:none;border:1px solid var(--cngx-border,#ddd);border-radius:4px;
                       padding:4px 10px;cursor:pointer;font-size:0.8125rem;
                       color:var(--interactive,#f5a623)">
          {{ expanded ? 'Collapse' : 'Expand' }}
          <span style="font-size:1rem">{{ expanded ? '▲' : '▼' }}</span>
        </button>
      </ng-template>
    </cngx-expandable-text>
  </div>`,
    },
  ],
};
