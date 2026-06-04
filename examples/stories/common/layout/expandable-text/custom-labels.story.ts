import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxExpandableText: Custom labels',
  subtitle:
    'Override <code>moreLabel</code> and <code>lessLabel</code> for localized copy. Two-line clamp shown with German labels.',
  description:
    'Swaps the default "Show more" / "Show less" strings via the moreLabel and lessLabel inputs so the toggle reads in the consumer locale. The default English copy stays in the library; localized copy is consumer-supplied.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['behavior', 'visual-variants'],
  apiComponents: ['CngxExpandableText'],
  moduleImports: ["import { CngxExpandableText } from '@cngx/common/layout';"],
  imports: ['CngxExpandableText'],
  template: `
  <div style="max-width:400px">
    <cngx-expandable-text [lines]="2" moreLabel="Mehr anzeigen" lessLabel="Weniger">
      CNGX ist die fehlende Kompositionsschicht zwischen Angular CDK und Angular Material.
      Es macht beides deklarativ, Signal-first und kommunikativ, ohne sie zu ersetzen.
      Jede Komponente ist dafuer verantwortlich, ihren Zustand vollstaendig zu kommunizieren.
    </cngx-expandable-text>
  </div>`,
};
